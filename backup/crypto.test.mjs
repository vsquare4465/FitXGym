import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { backupKey, encrypt, decrypt } from './crypto.mjs';
test('recovery accepts the original key and rejects tampering and a wrong key', () => {
  const key = backupKey(randomBytes(32).toString('hex'));
  const original = Buffer.from('Private gym records\0binary\xff');
  const encrypted = encrypt(original, key);
  assert.deepEqual(decrypt(encrypted, key), original);
  assert.notDeepEqual(encrypt(original, key), encrypted);
  assert.throws(() => decrypt(encrypted, randomBytes(32)));
  for (const offset of [0, 8, 20, 36, encrypted.length - 1]) {
    const changed = Buffer.from(encrypted); changed[offset] ^= 1;
    assert.throws(() => decrypt(changed, key));
  }
  assert.throws(() => decrypt(encrypted.subarray(0, 35), key));
  assert.throws(() => backupKey('short'));
});
