// No third-party dependencies. Runs on Node 22.13+ and an OS with tar.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { backupKey, encrypt, decrypt } from './crypto.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const source = path.resolve(process.env.FITX_SOURCE_DIR || '.');
const output = path.resolve(process.env.FITX_OUTPUT_DIR || '.wrangler/cloud-backup-output');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'fitx-backup-'));
const folder = path.join(work, 'backup');
const maxArchive = 20 * 1024 * 1024;
const maxRaw = 250 * 1024 * 1024;
let rawSize = 0;
const hashes = {};
function save(name, bytes) {
  rawSize += Buffer.byteLength(bytes);
  if (rawSize > maxRaw) throw new Error('Backup exceeds the raw size safety limit; review storage before increasing it.');
  const target = path.join(folder, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes, { mode: 0o600 });
  hashes[name] = sha(bytes);
}
function command(exe, args, cwd) {
  const r = spawnSync(exe, args, { cwd, encoding: 'utf8', timeout: 120000, maxBuffer: 32 * 1024 * 1024 });
  // Never print subprocess errors: SQL or signed URLs may appear there.
  if (r.status !== 0) throw new Error(`Backup verification or packaging failed (${path.basename(exe)}).`);
  return r.stdout;
}
async function request(url, options = {}) {
  for (let attempt = 0; attempt < 4; attempt++) {
    let response;
    try { response = await fetch(url, { ...options, signal: AbortSignal.timeout(60000) }); }
    catch { if (attempt < 3) { await sleep(1000 * 2 ** attempt); continue; } throw new Error('Backup network request failed.'); }
    if (response.ok) return response;
    const retry = (response.status === 429 || response.status >= 500) && attempt < 3;
    await response.body?.cancel();
    if (!retry) throw new Error(`Backup API request failed (HTTP ${response.status}). Check permissions and service availability.`);
    await sleep(1000 * 2 ** attempt);
  }
}
async function boundedBytes(response, limit) {
  const chunks = []; let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > limit) throw new Error('Downloaded backup data exceeds its size safety limit.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
function verify(dir) {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  for (const [name, expected] of Object.entries(manifest.files)) {
    if (sha(fs.readFileSync(path.join(dir, name))) !== expected) throw new Error('Backup file checksum failed.');
  }
  const script = fileURLToPath(new URL('./verify-data.mjs', import.meta.url));
  console.log(command(process.execPath, [script, dir]).trim());
}
try {
  const key = backupKey(process.env.FITX_BACKUP_KEY);
  const secrets = JSON.parse(process.env.FITX_RECOVERY_SECRETS || '{}');
  if (secrets.AUTH_PEPPER?.length < 32 || secrets.JWT_SECRET?.length < 32 || !secrets.AUTH_PEPPER || !secrets.JWT_SECRET) throw new Error('Recovery secrets are missing.');
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) throw new Error('CLOUDFLARE_API_TOKEN is missing.');
  const config = JSON.parse(fs.readFileSync(path.join(source, 'wrangler.jsonc'), 'utf8'));
  const database = config.d1_databases.find(x => x.binding === 'DB');
  const media = config.kv_namespaces.find(x => x.binding === 'MEDIA');
  const base = `https://api.cloudflare.com/client/v4/accounts/${config.account_id}`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  async function api(endpoint, body) {
    const r = await request(base + endpoint, { headers, ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}) });
    const result = await r.json();
    if (!result.success) throw new Error('Cloudflare backup request was unsuccessful.');
    return result;
  }
  console.log('Exporting database and downloading media.');
  let bookmark; let sql;
  for (let poll = 0; poll < 120; poll++) {
    const { result } = await api(`/d1/database/${database.database_id}/export`, { output_format: 'polling', ...(bookmark ? { current_bookmark: bookmark } : {}) });
    if (result.status === 'error') throw new Error('Cloudflare database export failed.');
    if (result.status === 'complete') {
      // Signed download URL is intentionally never logged; do not send account authorization to it.
      const url = new URL(result.result.signed_url);
      if (url.protocol !== 'https:') throw new Error('Invalid export URL.');
      sql = await boundedBytes(await request(url), maxRaw);
      break;
    }
    if (!result.at_bookmark) throw new Error('Database export did not return a polling bookmark.');
    bookmark = result.at_bookmark;
    await sleep(1000);
  }
  if (!sql?.includes(Buffer.from('CREATE TABLE'))) throw new Error('Database export timed out or is empty.');
  save('database.sql', sql);
  const kv = `/storage/kv/namespaces/${media.id}`;
  let cursor = ''; const keys = []; const cursors = new Set();
  do {
    const result = await api(`${kv}/keys?limit=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    if (!Array.isArray(result.result)) throw new Error('Invalid media listing.');
    keys.push(...result.result);
    cursor = result.result_info?.cursor || '';
    if (cursor && cursors.has(cursor)) throw new Error('Repeated media pagination cursor.');
    if (cursor) cursors.add(cursor);
  } while (cursor);
  const entries = [];
  for (const item of keys) {
    const name = `media/${sha(Buffer.from(item.name))}.bin`;
    const bytes = await boundedBytes(await request(base + kv + `/values/${encodeURIComponent(item.name)}`, { headers }), maxRaw - rawSize);
    save(name, bytes);
    entries.push({ key: item.name, file: name, metadata: item.metadata || {}, ...(item.expiration ? { expiration: item.expiration } : {}) });
  }
  save('media-index.json', JSON.stringify(entries, null, 2));
  save('recovery-secrets.json', JSON.stringify({ AUTH_PEPPER: secrets.AUTH_PEPPER, JWT_SECRET: secrets.JWT_SECRET }, null, 2));
  const listing = command('git', ['ls-files', '-z'], source);
  for (const name of listing.split('\0').filter(Boolean)) {
    if (name.split('/').some(p => ['..', '.git', '.wrangler'].includes(p)) || /(^|\/)\.env(\.|$)/.test(name) && !name.endsWith('.env.example')) continue;
    if (fs.lstatSync(path.join(source, name)).isFile()) save(`app/${name}`, fs.readFileSync(path.join(source, name)));
  }
  save('RESTORE.txt', fs.readFileSync(path.join(source, 'BACKUPS.md')));
  const createdAt = new Date().toISOString();
  fs.writeFileSync(path.join(folder, 'manifest.json'), JSON.stringify({ version: 1, createdAt, accountId: config.account_id, database, mediaNamespace: media.id, mediaCount: entries.length, sourceCommit: command('git', ['rev-parse', 'HEAD'], source).trim(), files: hashes }, null, 2));
  verify(folder);
  const tar = path.join(work, 'backup.tar.gz');
  command('tar', ['-czf', tar, '-C', work, 'backup']);
  const plaintext = fs.readFileSync(tar);
  const encrypted = encrypt(plaintext, key);
  if (encrypted.length > maxArchive) throw new Error('Encrypted backup exceeds 20 MiB; no upload was made. Review free storage before increasing the limit.');
  // Verify actual authenticated decryption, extraction, hashes and database restore.
  const decoded = decrypt(encrypted, key);
  if (!decoded.equals(plaintext)) throw new Error('Encrypted backup round-trip failed.');
  const recovered = path.join(work, 'recovered'); fs.mkdirSync(recovered);
  fs.writeFileSync(path.join(work, 'verified.tar.gz'), decoded);
  command('tar', ['-xzf', path.join(work, 'verified.tar.gz'), '-C', recovered]);
  verify(path.join(recovered, 'backup'));
  const name = `fitx-${createdAt.replaceAll(':', '-')}.fitx`;
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, name), encrypted, { flag: 'wx', mode: 0o600 });
  fs.writeFileSync(path.join(output, name + '.sha256'), `${sha(encrypted)}  ${name}\n`, { flag: 'wx' });
  console.log(`PASS: encrypted full backup (${entries.length} media files, ${(encrypted.length / 1048576).toFixed(2)} MiB).`);
} catch (error) {
  console.error(error instanceof SyntaxError ? 'Backup configuration is invalid JSON.' : error.message);
  process.exitCode = 1;
} finally {
  // Only the unique temporary directory created above is removed, never source or backups.
  fs.rmSync(work, { recursive: true, force: true });
}
