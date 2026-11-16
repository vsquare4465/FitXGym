import fs from 'node:fs';
import assert from 'node:assert/strict';
const base = 'https://fitx-gym.vaishalivvarshney.workers.dev';
const state = JSON.parse(fs.readFileSync('.wrangler/bootstrap-production.json','utf8'));
async function request(path, method='GET', body, token) {
  const response = await fetch(base+'/api'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
  const data = await response.json();
  assert.equal(response.status,200,`${method} ${path}: ${JSON.stringify(data)}`);
  return data;
}
const {token} = await request('/auth/login','POST',{email:state.email,password:state.password,loginType:'admin'});
const original = await request('/gallery','GET',undefined,token);
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
const bytes = Buffer.concat([png,Buffer.alloc(1024*1024)]);
try {
  const [image] = await request('/gallery','PUT',[{url:`data:image/png;base64,${bytes.toString('base64')}`,caption:'Temporary upload check'}],token);
  const response = await fetch(base+image.url,{signal:AbortSignal.timeout(30000)});
  assert.equal(response.status,200);
  assert.equal((await response.arrayBuffer()).byteLength,bytes.length);
  console.log('PASS: 1 MB upload persisted to Cloudflare KV and downloaded intact.');
} finally { await request('/gallery','PUT',original,token); }
