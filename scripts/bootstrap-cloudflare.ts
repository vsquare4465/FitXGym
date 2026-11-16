import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { MEMBERSHIP_PLANS } from '../src/data/mockData';
import { defaultSettings } from '../server/lib/defaultSettings';

const remote = process.argv.includes('--remote');
const stateFile = remote ? '.wrangler/bootstrap-production.json' : '.wrangler/bootstrap-local.json';
fs.mkdirSync('.wrangler', { recursive: true });
if (remote && !fs.existsSync(stateFile)) {
  // Never replace the pepper on an existing database when moving checkouts.
  const probe = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js','d1','execute','fitx-gym-db','--remote','--json','--command',`SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='User'`], {encoding:'utf8'});
  if (probe.status !== 0) throw new Error('Could not verify the production database before initialization');
  if (JSON.parse(probe.stdout)[0]?.results?.[0]?.n) {
    const users = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js','d1','execute','fitx-gym-db','--remote','--json','--command','SELECT COUNT(*) AS n FROM "User"'], {encoding:'utf8'});
    if (users.status !== 0 || JSON.parse(users.stdout)[0]?.results?.[0]?.n > 0) throw new Error('Production has users but this checkout has no bootstrap state. Preserve existing Worker secrets; do not initialize again.');
  }
}
const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {
  email: 'deepaksolanki@fitxgymkhurja.com',
  password: randomBytes(24).toString('base64url'),
  secrets: { JWT_SECRET: randomBytes(48).toString('base64url'), AUTH_PEPPER: randomBytes(48).toString('base64url') },
};
fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), { mode: 0o600 });
const quote = (v: unknown) => v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replaceAll("'", "''")}'`;
const salt = randomBytes(16);
const hash = `pbkdf2-sha256$100000$${salt.toString('hex')}$${pbkdf2Sync(`${state.secrets.AUTH_PEPPER}\0${state.password}`, salt, 100000, 32, 'sha256').toString('hex')}`;
const now = Date.now();
const sql = [
  `INSERT OR IGNORE INTO "User" ("id","email","passwordHash","name","role","permissions","createdAt","updatedAt") VALUES (${[randomBytes(16).toString('hex'),state.email,hash,'Deepak Solanki','OWNER','{}',now,now].map(quote).join(',')});`,
  ...MEMBERSHIP_PLANS.map(p => `INSERT OR IGNORE INTO "Plan" ("id","name","duration","price","description","features","popular","active") VALUES (${[p.id,p.name,p.duration,p.price,p.description || '',JSON.stringify(p.features),p.popular ? 1 : 0,1].map(quote).join(',')});`),
  ...Object.entries(defaultSettings).filter(([,v]) => !/unsplash\.com/i.test(v)).map(([key,value]) => `INSERT OR IGNORE INTO "WebsiteSetting" ("key","value") VALUES (${quote(key)},${quote(value)});`),
];
const sqlFile = remote ? '.wrangler/bootstrap-production.sql' : '.wrangler/bootstrap-local.sql';
fs.writeFileSync(sqlFile, sql.join('\n'));
function wrangler(args: string[], input?: string) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], { input, encoding: 'utf8', stdio: input ? ['pipe','pipe','pipe'] : 'inherit', env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
  if (input) { process.stdout.write(result.stdout || ''); process.stderr.write(result.stderr || ''); }
  if (result.status !== 0) throw new Error(`Wrangler ${args[0]} failed (${result.status})`);
}
wrangler(['d1','migrations','apply','fitx-gym-db',remote ? '--remote' : '--local']);
wrangler(['d1','execute','fitx-gym-db',remote ? '--remote' : '--local','--file',sqlFile]);
if (remote) {
  wrangler(['secret','bulk'], JSON.stringify(state.secrets));
  fs.writeFileSync('.wrangler/owner-login.txt', `Fit X Gym owner login\nEmail: ${state.email}\nPassword: ${state.password}\nChange the password after first sign-in.\n`, { mode: 0o600 });
  console.log(`Production owner credentials saved privately to ${path.resolve('.wrangler/owner-login.txt')}`);
} else {
  fs.writeFileSync('.dev.vars', Object.entries(state.secrets).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join('\n') + '\n', { mode: 0o600 });
  console.log('Local D1 and test secrets initialized; no demo members or payments added.');
}
