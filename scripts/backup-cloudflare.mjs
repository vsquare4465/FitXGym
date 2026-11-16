import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const config = JSON.parse(fs.readFileSync('wrangler.jsonc', 'utf8'));
const database = config.d1_databases.find(d => d.binding === 'DB');
const media = config.kv_namespaces.find(k => k.binding === 'MEDIA');
const folder = path.resolve('.wrangler/backups', `fitx-full-${new Date().toISOString().replaceAll(':', '-')}`);
const zip = `${folder}.zip`;
const hashes = {};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function save(name, bytes) {
  const target = path.join(folder, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, bytes, { mode: 0o600 });
  hashes[name.replaceAll('\\', '/')] = sha(bytes);
}
try {
  const state = JSON.parse(fs.readFileSync('.wrangler/bootstrap-production.json', 'utf8'));
  if (!state.secrets?.AUTH_PEPPER || !state.secrets?.JWT_SECRET) throw new Error('Local recovery secrets are missing. Preserve the Worker AUTH_PEPPER before backing up.');
  fs.mkdirSync(folder, { recursive: true });
  console.log('1/4 Exporting the live gym database...');
  // Never print Wrangler output: exports may contain signed download URLs.
  const exported = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'd1', 'export', database.database_name, '--remote', '--output', path.join(folder, 'database.sql')], { encoding: 'utf8', timeout: 300000, maxBuffer: 32 * 1024 * 1024 });
  if (exported.status !== 0) throw new Error('Database export failed. Run npx wrangler login, then retry.');
  const sql = fs.readFileSync(path.join(folder, 'database.sql'));
  if (!sql.includes(Buffer.from('CREATE TABLE'))) throw new Error('Database export is empty or invalid.');
  hashes['database.sql'] = sha(sql);
  // Export refreshes Wrangler OAuth. Reuse the login without saving its token.
  const token = process.env.CLOUDFLARE_API_TOKEN || fs.readFileSync(path.join(process.env.APPDATA, 'xdg.config/.wrangler/config/default.toml'), 'utf8').match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
  if (!token) throw new Error('Cloudflare login is missing. Run npx wrangler login.');
  const base = `https://api.cloudflare.com/client/v4/accounts/${config.account_id}/storage/kv/namespaces/${media.id}`;
  async function api(endpoint) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(base + endpoint, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(60000) });
      if (response.ok) return response;
      if ((response.status === 429 || response.status >= 500) && attempt < 3) {
        await response.body?.cancel();
        await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
        continue;
      }
      throw new Error(`Media download failed (HTTP ${response.status}). Retry the backup.`);
    }
  }
  console.log('2/4 Downloading uploaded images and documents...');
  let cursor = ''; const keys = [];
  do {
    const result = await (await api(`/keys?limit=1000${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`)).json();
    if (!result.success || !Array.isArray(result.result)) throw new Error('Could not list media.');
    keys.push(...result.result);
    cursor = result.result_info?.cursor || '';
  } while (cursor);
  const entries = [];
  for (const key of keys) {
    const filename = `media/${sha(Buffer.from(key.name))}.bin`;
    const bytes = Buffer.from(await (await api(`/values/${encodeURIComponent(key.name)}`)).arrayBuffer());
    save(filename, bytes);
    entries.push({ key: key.name, file: filename, metadata: key.metadata || {}, ...(key.expiration ? { expiration: key.expiration } : {}) });
    if (entries.length % 10 === 0) console.log(`  Saved ${entries.length}/${keys.length} files`);
  }
  save('media-index.json', JSON.stringify(entries, null, 2));
  const backedUpKeys = new Set(entries.map(entry => entry.key));
  for (const match of sql.toString('utf8').matchAll(/\/api\/public\/media\/([a-f0-9]{64})/g)) {
    if (!backedUpKeys.has(match[1])) throw new Error('A database-referenced upload is missing. Wait for recent uploads to finish, then retry the backup.');
  }
  console.log('3/4 Saving application source and private login-recovery secrets...');
  save('recovery-secrets.json', JSON.stringify(state.secrets, null, 2));
  const listing = spawnSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (listing.status !== 0) throw new Error('Could not include application source.');
  for (const name of new Set(listing.stdout.split('\0').filter(Boolean))) {
    if (name.split('/').some(part => ['..', '.git', '.wrangler'].includes(part)) || /^\.env(\.|$)/.test(name) && name !== '.env.example') continue;
    if (fs.existsSync(name) && fs.lstatSync(name).isFile()) save(`app/${name}`, fs.readFileSync(name));
  }
  save('RESTORE.txt', fs.readFileSync('BACKUPS.md'));
  fs.writeFileSync(path.join(folder, 'manifest.json'), JSON.stringify({ version: 1, createdAt: new Date().toISOString(), accountId: config.account_id, database, mediaNamespace: media.id, mediaCount: entries.length, files: hashes }, null, 2));
  for (const [name, expected] of Object.entries(hashes)) {
    if (sha(fs.readFileSync(path.join(folder, name))) !== expected) throw new Error(`Backup verification failed: ${name}`);
  }
  console.log('4/4 Creating the private ZIP archive...');
  const archive = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', "$ErrorActionPreference = 'Stop'; Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory($env:FITX_BACKUP_SOURCE, $env:FITX_BACKUP_ZIP, [System.IO.Compression.CompressionLevel]::Optimal, $true)"], { env: { ...process.env, FITX_BACKUP_SOURCE: folder, FITX_BACKUP_ZIP: zip }, encoding: 'utf8', timeout: 300000 });
  if (archive.status !== 0 || !fs.existsSync(zip)) throw new Error('ZIP creation failed. The verified backup folder is still available.');
  fs.writeFileSync(`${zip}.sha256`, `${sha(fs.readFileSync(zip))}  ${path.basename(zip)}\n`);
  const verified = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', 'scripts/verify-backup.ps1', '-BackupZip', zip], { encoding: 'utf8', timeout: 300000 });
  if (verified.status !== 0) throw new Error('Archive verification failed. Do not rely on this ZIP.');
  console.log(verified.stdout.trim());
  console.log(`Backup complete: ${entries.length} uploads plus database, app source, and recovery secrets.\n${zip}\nCopy the ZIP and .sha256 file to private external storage. Keep older backups. This archive contains private gym data and secrets.`);
} catch (error) {
  console.error(error.message);
  console.error(`Do not rely on an incomplete backup folder: ${folder}`);
  process.exitCode = 1;
}
