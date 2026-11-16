import fs from 'node:fs';
import assert from 'node:assert/strict';
const base = process.argv.find(a=>a.startsWith('http')) || 'http://127.0.0.1:8787';
const state = JSON.parse(fs.readFileSync(base.includes('workers.dev') ? '.wrangler/bootstrap-production.json' : '.wrangler/bootstrap-local.json','utf8'));
let token;
let checks = 0;
async function api(path, method='GET', body, auth=token) {
  const response = await fetch(`${base}/api${path}`, {method,headers:{'Content-Type':'application/json',...(auth?{Authorization:`Bearer ${auth}`}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(30000)});
  const data = await response.json();
  assert.equal(response.status,200,`${method} ${path}: ${JSON.stringify(data)}`);
  checks++;
  return data;
}
token = (await api('/auth/login','POST',{email:state.email,password:state.password,loginType:'admin'},null)).token;
const suffix = Date.now();
const plan = {id:`test-plan-${suffix}`,name:'Migration custom plan',price:100,duration:'1 Month',features:['Test feature'],active:true,popular:false};
let member, staff;
try {
  await api('/plans','PUT',[plan]);
  assert.ok((await api('/public/plans')).some(p=>p.id===plan.id));
  await api('/plans','PUT',[{...plan,price:150}]);
  assert.equal((await api('/plans')).find(p=>p.id===plan.id).price,150);
  member = await api('/members','POST',{name:'Migration phone-only',phone:'9876543299',planId:plan.id,paidAmount:0});
  const memberAuth = await api('/auth/login','POST',{email:'9876543299',password:'123456',loginType:'member'},null);
  assert.equal(memberAuth.user.memberId,member.id);
  const messages = [{id:'test-message',text:'Migration coaching message',sender:'trainer',date:'2026-11-13'}];
  const workoutPlan = [{name:'Squat',sets:3,reps:'10'}];
  const dietPlan = [{meal:'Breakfast',food:'Oats'}];
  await api(`/members/${member.id}`,'PUT',{messages,workoutPlan,dietPlan});
  const me = await api('/member/me','GET',undefined,memberAuth.token);
  assert.deepEqual(me.messages,messages); assert.deepEqual(me.workoutPlan,workoutPlan); assert.deepEqual(me.dietPlan,dietPlan);
  const password = 'Disposable-Staff!8395';
  staff = await api('/team','POST',{name:'Migration password check',email:`password-${suffix}@example.com`,password,role:'TRAINER'});
  const staffToken = (await api('/auth/login','POST',{email:staff.email,password,loginType:'admin'},null)).token;
  await api('/auth/me','PUT',{name:'Migration updated staff'},staffToken);
  await api('/auth/password','PUT',{currentPassword:password,newPassword:password+'2'},staffToken);
  await api('/auth/login','POST',{email:staff.email,password:password+'2',loginType:'admin'},null);
  for (const path of ['/','/admin/login','/admin/members','/member','/checkin','/legal/privacy','/legal/terms','/legal/refund']) {
    const response = await fetch(base+path,{signal:AbortSignal.timeout(30000)});
    assert.equal(response.status,200,path); assert.match(response.headers.get('content-type'),/text\/html/); checks++;
  }
  console.log(`PASS: ${checks} additional checks for plan editing, phone-only member login, coaching messages, workout/diet JSON, profile/password changes, and SPA deep links.`);
} finally {
  if (member) await api(`/members/${member.id}`,'DELETE');
  if (staff) await api(`/team/${staff.id}`,'DELETE');
  await api(`/plans/${plan.id}`,'DELETE');
}
