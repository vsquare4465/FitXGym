// Local integration test. Never points at the production database.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:8787';
const state = JSON.parse(fs.readFileSync('.wrangler/bootstrap-local.json', 'utf8'));
let token; let member;
async function api(route, method = 'GET', body) {
  const response = await fetch(base + '/api' + route, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json();
  assert.equal(response.status, 200, `${method} ${route}: HTTP ${response.status}`);
  return data;
}
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j9WQAAAAASUVORK5CYII=';
try {
  token = (await api('/auth/login', 'POST', { email: state.email, password: state.password, loginType: 'admin' })).token;
  const plan = (await api('/plans')).find(p => p.price > 0);
  assert.ok(plan, 'Local fixture needs a paid plan');
  member = await api('/members', 'POST', { name: 'LOCAL document regression', planId: plan.id, paidAmount: 10, idProofUrl: png, notes: 'Preserved hidden notes', alcoholic: true, emergencyContact: { name: 'Fixture', phone: '', relationship: '' } });
  assert.match(member.idProofUrl, /^\/api\/public\/media\/[a-f0-9]{64}$/);
  let media = await fetch(base + member.idProofUrl);
  assert.equal(media.headers.get('content-type'), 'image/png');
  assert.ok((await media.arrayBuffer()).byteLength > 0);
  const pdf = 'data:application/pdf;base64,' + Buffer.from('%PDF-1.4\n% Local synthetic document\n%%EOF').toString('base64');
  const updated = await api(`/members/${member.id}`, 'PUT', { idProofUrl: pdf, name: 'LOCAL edited document' });
  assert.notEqual(updated.idProofUrl, member.idProofUrl);
  media = await fetch(base + updated.idProofUrl);
  assert.equal(media.headers.get('content-type'), 'application/pdf');
  const profile = await api(`/members/${member.id}/profile`);
  assert.equal(profile.member.idProofUrl, updated.idProofUrl);
  assert.equal(profile.member.notes, 'Preserved hidden notes');
  assert.equal(profile.member.alcoholic, true);
  assert.equal(profile.member.emergencyContact.name, 'Fixture');
  assert.equal(profile.payments.find(p => p.amount > 0 && p.status !== 'Failed').amount, 10);
  assert.equal(profile.pendingAmount, Math.max(0, plan.price - 10));
  const payment = await api('/payments', 'POST', { memberId: member.id, membershipId: profile.currentMembership.id, memberName: member.name, amount: 20, date: profile.payments[0].date, category: 'Partial Payment', paymentMethod: 'Cash', status: 'Completed' });
  const refreshed = await api(`/members/${member.id}/profile`);
  assert.equal(refreshed.payments[0].id, payment.id, 'Same-day payments should show most recently recorded first');
  assert.equal(refreshed.pendingAmount, Math.max(0, plan.price - 30), 'Old pending record must not override later receipts');
  if (plan.price > 30) await api('/payments', 'POST', { memberId: member.id, membershipId: profile.currentMembership.id, amount: plan.price - 30, date: profile.payments[0].date, status: 'Completed' });
  const settled = await api(`/members/${member.id}/profile`);
  assert.equal(settled.pendingAmount, 0);
  assert.notEqual(settled.displayStatus, 'Payment Pending');
  assert.equal((await api(`/members/${member.id}`, 'PUT', { idProofUrl: '' })).idProofUrl, '');
  console.log('PASS: Aadhaar create/read/replace/remove, PNG/PDF retrieval, hidden-data preservation, and latest same-day payment ordering.');
} finally {
  if (member) await api(`/members/${member.id}`, 'DELETE');
}
