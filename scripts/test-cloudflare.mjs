import fs from 'node:fs';
import assert from 'node:assert/strict';

const base = process.argv.find(a => a.startsWith('http')) || 'http://127.0.0.1:8787';
const remote = !base.includes('127.0.0.1') && !base.includes('localhost');
const state = JSON.parse(fs.readFileSync(remote ? '.wrangler/bootstrap-production.json' : '.wrangler/bootstrap-local.json','utf8'));
const suffix = Date.now();
const password = 'Integration-Test-Only!86';
const email = `migration-${suffix}@example.com`;
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
let token;
let checks = 0;
const created = { members: [], leads: [], expenses: [], team: [], testimonials: [] };
async function api(path, method = 'GET', body, auth = token, expected = 200) {
  const response = await fetch(`${base}/api${path}`, { method, headers: { 'Content-Type':'application/json', ...(auth ? {Authorization:`Bearer ${auth}`} : {}) }, ...(body === undefined ? {} : {body:JSON.stringify(body)}) });
  const data = await response.json().catch(() => ({}));
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
  checks++;
  return data;
}
const original = {};
try {
  assert.equal((await api('/health')).db,'ok');
  await api('/members','GET',undefined,null,401);
  await api('/missing-route','GET',undefined,null,401);
  await api('/auth/login','POST',{email:state.email,password:'incorrect',loginType:'admin'},null,401);
  token = (await api('/auth/login','POST',{email:state.email,password:state.password,loginType:'admin'},null)).token;
  assert.ok(token);
  assert.equal((await api('/auth/me')).user.adminRole,'OWNER');
  const plans = await api('/public/plans'); assert.ok(plans.length >= 4);
  const plan = plans[0];
  for (const path of ['/dashboard','/members','/payments','/expenses','/attendance','/leads','/staff','/inventory','/team','/audit-logs','/settings','/gallery','/testimonials']) await api(path);
  original.settings = await api('/settings'); original.gallery = await api('/gallery'); original.inventory = await api('/inventory'); original.staff = await api('/staff');
  const member = await api('/members','POST',{name:'Migration Test Member',email,phone:'9876543210',password,planId:plan.id,paidAmount:100,photo:png,gender:'Female',emergencyContact:{name:'Test'},medicalHistory:['test'],weight:65});
  created.members.push(member.id);
  assert.match(member.id,/^MEM-\d+$/); assert.ok(member.photo.startsWith('/api/public/media/')); assert.deepEqual(member.medicalHistory,['test']);
  const media = await fetch(`${base}${member.photo}`); assert.equal(media.status,200); assert.equal(media.headers.get('content-type'),'image/png'); assert.ok((await media.arrayBuffer()).byteLength > 0); checks++;
  await api(`/members/${member.id}`,'PUT',{name:'Migration Updated',gender:'Male',notes:'test update',weightHistory:[{date:'2026-11-13',weight:64}]});
  const profile = await api(`/members/${member.id}/profile`); assert.ok(profile);
  const renewal = await api(`/members/${member.id}/renew`,'POST',{planId:plan.id,paidAmount:50,paymentMethod:'Cash'});
  const payment = await api('/payments','POST',{memberId:member.id,membershipId:renewal.membership.id,amount:25,paymentMethod:'Cash'});
  await api(`/payments/${payment.id}`,'PUT',{notes:'test payment'});
  await api(`/payments/${payment.id}`,'DELETE');
  const memberToken = (await api('/auth/login','POST',{email,password,loginType:'member'},null)).token;
  assert.equal((await api('/member/me','GET',undefined,memberToken)).id,member.id);
  await api('/member/me','PUT',{bmi:22,progressImages:[png],dietPlan:[],workoutPlan:[]},memberToken);
  await api('/member/payments','GET',undefined,memberToken);
  await api('/member/renew','POST',{planId:plan.id,paidAmount:20,paymentMethod:'UPI'},memberToken);
  await api('/members','GET',undefined,memberToken,403);
  const qr = await api('/qr-token');
  assert.equal((await api(`/public/checkin-token/${qr.token}`)).valid,true);
  await api('/public/checkin','POST',{token:qr.token,memberId:member.id,phone:'9876543210'});
  assert.equal((await api(`/public/checkin-status?token=${qr.token}&memberId=${member.id}`)).checkedIn,true);
  await api('/public/checkin','POST',{token:qr.token,memberId:member.id,action:'out'});
  const record = await api('/attendance/checkin','POST',{memberId:member.id});
  await api('/attendance/checkout','POST',{memberId:member.id});
  await api(`/attendance/${record.id}`,'PUT',{status:'On Time'});
  await api(`/attendance/${record.id}`,'DELETE');
  const rotated = await api('/qr-token/rotate','POST'); assert.notEqual(rotated.token,qr.token);
  assert.equal((await api(`/public/checkin-token/${qr.token}`)).valid,false);
  const expense = await api('/expenses','POST',{category:'Maintenance',amount:10,date:'2026-11-13',description:'Migration test',paymentMethod:'Cash'}); created.expenses.push(expense.id);
  await api(`/expenses/${expense.id}`,'PUT',{amount:15});
  await api('/expenses','PUT',[{...expense,amount:20}]);
  const staff = await api('/team','POST',{name:'Migration Staff',email:`staff-${suffix}@example.com`,password,role:'TRAINER',phone:'9876543211'}); created.team.push(staff.id);
  await api(`/team/${staff.id}`,'PUT',{name:'Migration Updated Staff',jobTitle:'Test'});
  const staffToken = (await api('/auth/login','POST',{email:staff.email,password,loginType:'admin'},null)).token;
  await api('/team','GET',undefined,staffToken,403);
  const otp = await api(`/team/${staff.id}/reset-otp`,'POST'); assert.match(otp.code,/^\d{6}$/);
  await api('/auth/reset-password','POST',{emailOrPhone:staff.email,otp:otp.code,newPassword:password+'2'},null);
  await api('/auth/reset-password','POST',{emailOrPhone:staff.email,otp:otp.code,newPassword:password+'3'},null,400);
  await api('/auth/login','POST',{email:staff.email,password:password+'2',loginType:'admin'},null);
  // A duplicate login must roll back the preceding member insert too.
  const before = (await api('/members')).length;
  await api('/public/register','POST',{member:{name:'Rollback test',email:staff.email,phone:'9876543212',planId:plan.id,password,status:'Active'}},null,409);
  assert.equal((await api('/members')).length,before);
  const registration = await api('/public/register','POST',{member:{name:'Migration Public Member',email:`public-${suffix}@example.com`,phone:'9876543213',planId:plan.id,password,status:'Active'},planPrice:plan.price,paymentMethod:'UPI'},null); created.members.push(registration.id);
  const lead = await api('/public/leads','POST',{name:'Migration Lead',phone:'9876543214',email:`lead-${suffix}@example.com`,source:'Contact'},null); created.leads.push(lead.id);
  await api(`/leads/${lead.id}`,'PATCH',{notes:'Test followup'});
  const converted = await api(`/leads/${lead.id}/convert`,'POST',{planId:plan.id}); created.members.push(converted.id);
  const settings = Object.fromEntries(Array.from({length:75},(_,i)=>[`_migration_${i}`,`value${i}`]));
  await api('/settings','PUT',{...original.settings,...settings,heroImage:png,websiteDraft:JSON.stringify({heroImage:png})});
  const publicSettings = await api('/public/settings'); assert.ok(!('_migration_0' in publicSettings)); assert.ok(!('websiteDraft' in publicSettings)); assert.ok(publicSettings.heroImage.startsWith('/api/public/media/'));
  const gallery = await api('/gallery','PUT',[{url:png,caption:'Migration test',active:true,featured:true}]); assert.equal(gallery.length,1);
  assert.equal((await api('/public/gallery')).length,1);
  await api('/gallery','PUT',[{url:png,caption:'Temporary'},{url:'https://example.test/invalid',caption:{invalid:true}}],token,500);
  assert.equal((await api('/gallery')).length,1);
  const testimonial = await api('/public/testimonials','POST',{name:'Migration feedback',rating:5,text:'Test'},null); created.testimonials.push(testimonial.id);
  await api(`/testimonials/${testimonial.id}/approve`,'PATCH'); assert.ok((await api('/public/testimonials')).some(t=>t.id===testimonial.id));
  await api('/inventory','PUT',[{id:`test-${suffix}`,name:'Test item',category:'Test',stock:1,price:10,costPrice:5,supplier:'Test',lowStockLimit:1}]);
  await api('/staff','PUT',[{id:`test-${suffix}`,name:'Test staff',role:'Trainer',salary:100,shift:'Morning',joiningDate:'2026-11-13',documents:[],salaryHistory:[],tasks:[]}]);
  await api('/dashboard?period=month');
  await api(`/members/${member.id}/deactivate`,'POST');
  await api('/auth/logout','POST');
  console.log(`PASS: ${checks} API checks covering auth, permissions, members, registration rollback, renewals, payments, QR attendance, expenses, leads, team, OTP, uploads, settings, gallery, testimonials, staff, inventory, dashboard.`);
} finally {
  // Tests use only explicitly-created records; do not reset the database.
  for (const [kind, ids] of Object.entries(created)) for (const id of ids) {
    try { await api(`/${kind}/${id}`,'DELETE'); } catch (err) { console.error(`Cleanup ${kind}/${id}: ${err.message}`); }
  }
  if (original.settings) await api('/settings','PUT',original.settings);
  if (original.gallery) await api('/gallery','PUT',original.gallery);
  // Legacy bulk APIs upsert, so disposable inventory/staff rows are removed by
  // the local/remote cleanup SQL after successful validation, never wholesale.
  const addedSettings = ['heroImage','websiteDraft'].filter(key => original.settings && !(key in original.settings));
  fs.writeFileSync('.wrangler/test-cleanup.sql', `DELETE FROM "WebsiteSetting" WHERE "key" LIKE '_migration_%';\n${addedSettings.map(key => `DELETE FROM "WebsiteSetting" WHERE "key" = '${key}';`).join('\n')}\nDELETE FROM "InventoryItem" WHERE "id" = 'test-${suffix}';\nDELETE FROM "Staff" WHERE "id" = 'test-${suffix}';\n`);
}
