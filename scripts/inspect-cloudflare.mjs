import fs from 'node:fs';
import path from 'node:path';
const configFile = path.join(process.env.APPDATA, 'xdg.config/.wrangler/config/default.toml');
const config = fs.readFileSync(configFile, 'utf8');
const token = config.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];
if (!token) throw new Error('Wrangler OAuth login is required');
const account = JSON.parse(fs.readFileSync('wrangler.jsonc','utf8')).account_id;
async function api(endpoint) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
  const body = await response.json();
  if (!body.success) return { error: body.errors?.map(e=>({code:e.code,message:e.message})), status: response.status };
  return body.result;
}
const [subscriptions, settings, domains, zones, health, routes, dns] = await Promise.all([
  api(`/accounts/${account}/subscriptions`),
  api(`/accounts/${account}/workers/scripts/fitx-gym/settings`),
  api(`/accounts/${account}/workers/domains`),
  api('/zones?name=fitxgymkhurja.com'),
  fetch('https://fitx-gym.vaishalivvarshney.workers.dev/api/health').then(r=>r.json()),
  api('/zones/4385e59d2f875301859a2f0b00dfc772/workers/routes'),
  api('/zones/4385e59d2f875301859a2f0b00dfc772/dns_records?per_page=100'),
]);
console.log(JSON.stringify({
  subscriptions: Array.isArray(subscriptions) ? subscriptions.map(s=>({status:s.state, product:s.rate_plan?.public_name, price:s.price, frequency:s.frequency})) : subscriptions,
  worker: settings.error ? settings : { usage_model: settings.usage_model, bindings: settings.bindings?.map(b=>({name:b.name,type:b.type})), compatibility_date:settings.compatibility_date },
  domains,
  health,
  routes: Array.isArray(routes) ? routes.filter(r=>r.script==='fitx-gym').map(r=>({pattern:r.pattern,script:r.script})) : routes,
  websiteDns: Array.isArray(dns) ? dns.filter(r=>['fitxgymkhurja.com','www.fitxgymkhurja.com'].includes(r.name) && ['A','AAAA','CNAME'].includes(r.type)).map(r=>({name:r.name,type:r.type,proxied:r.proxied})) : dns,
  zones: Array.isArray(zones) ? zones.map(z=>({id:z.id,name:z.name,status:z.status,plan:z.plan?.name,name_servers:z.name_servers})) : zones,
},null,2));
