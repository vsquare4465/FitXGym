import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memberOutstandingBalance } from '../server/lib/memberBalance.ts';
const membership = { id: 'ms-1', memberId: 'member-1', amount: 1799, paidAmount: 1200 };
const unpaid = { memberId: 'member-1', membershipId: 'ms-1', status: 'Pending', amount: 0, expectedAmount: 1799 };
test('old unpaid record cannot override a later partial payment', () => {
  assert.equal(memberOutstandingBalance([membership], [unpaid], 'member-1'), 599);
});
test('multiple pending snapshots of one membership do not duplicate debt', () => {
  assert.equal(memberOutstandingBalance([membership], [unpaid, { ...unpaid, amount: 500 }], 'member-1'), 599);
});
test('fully paid and overpaid memberships have no remaining debt', () => {
  for (const paidAmount of [1799, 2000]) assert.equal(memberOutstandingBalance([{ ...membership, paidAmount }], [unpaid], 'member-1'), 0);
});
test('other membership debt and standalone pending charges remain visible', () => {
  assert.equal(memberOutstandingBalance([membership, { ...membership, id: 'ms-2', amount: 1000, paidAmount: 700 }], [unpaid, { ...unpaid, membershipId: null, amount: 100, expectedAmount: 150 }], 'member-1'), 949);
  assert.equal(memberOutstandingBalance([membership], [unpaid], 'other-member'), 0);
});
test('failed standalone records and settled expected amounts add no debt', () => {
  assert.equal(memberOutstandingBalance([], [{ ...unpaid, membershipId: null, status: 'Failed' }, { ...unpaid, membershipId: null, amount: 1799 }], 'member-1'), 0);
});
