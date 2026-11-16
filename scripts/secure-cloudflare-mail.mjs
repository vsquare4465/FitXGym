import fs from 'node:fs';
import path from 'node:path';
const auth = fs.readFileSync(path.join(process.env.APPDATA,'xdg.config/.wrangler/config/default.toml'),'utf8').match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
if (!auth) throw new Error('Cloudflare login required');
const account = JSON.parse(fs.readFileSync('wrangler.jsonc','utf8')).account_id;
const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/fitx-gym/settings`,{headers:{Authorization:`Bearer ${auth}`}});
const settings = await response.json();
if (!settings.success) throw new Error('Could not read Worker configuration');
let binding = settings.result.bindings.find(b=>b.name==='SMTP_PASS');
if (binding?.type==='secret_text') { console.log('SMTP_PASS is already an encrypted secret.'); process.exit(0); }
if (!binding) {
  // A code deployment can remove dashboard plain variables. Recover only this
  // exact setting from the recent version history, keeping it in memory.
  const versions = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/fitx-gym/versions`,{headers:{Authorization:`Bearer ${auth}`}}).then(r=>r.json());
  for (const version of (versions.result?.items || []).slice(0,10)) {
    const result = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/fitx-gym/versions/${version.id}`,{headers:{Authorization:`Bearer ${auth}`}}).then(r=>r.json());
    const candidate = result.result?.resources?.bindings?.find(b=>b.name==='SMTP_PASS' && b.type==='plain_text');
    if (candidate?.text) { binding = candidate; break; }
  }
}
if (binding?.type!=='plain_text' || !binding.text) throw new Error('No recoverable mailbox setting; add SMTP_PASS as a Secret in the dashboard');
const target = settings.result.bindings.some(b=>b.name==='SMTP_PASS' && b.type==='plain_text') ? 'MAIL_PASSWORD' : 'SMTP_PASS';
const update = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/fitx-gym/secrets`,{method:'PUT',headers:{Authorization:`Bearer ${auth}`,'Content-Type':'application/json'},body:JSON.stringify({name:target,type:'secret_text',text:binding.text})}).then(r=>r.json());
if (!update.success) throw new Error(`Secret update rejected (${update.errors?.map(e=>e.code).join(',')})`);
console.log(`Mailbox password secured as encrypted Worker secret ${target}. No value was displayed or saved locally by this helper.`);
