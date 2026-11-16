// Native Web Crypto avoids bcrypt's JavaScript CPU cost on Workers Free.
// A server-side pepper also protects hashes if only the database is exposed.
const iterations = 100_000;
const hex = (v: Uint8Array) => Array.from(v, b => b.toString(16).padStart(2, '0')).join('');
const unhex = (v: string) => Uint8Array.from(v.match(/../g) || [], b => parseInt(b, 16));
async function derive(password: string, salt: Uint8Array, rounds: number) {
  const pepper = process.env.AUTH_PEPPER;
  if (!pepper || pepper.length < 32) throw new Error('AUTH_PEPPER must contain at least 32 characters');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(`${pepper}\0${password}`), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations: rounds }, key, 256));
}
async function hash(password: string, _cost?: number) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${iterations}$${hex(salt)}$${hex(await derive(password, salt, iterations))}`;
}
async function compare(password: string, encoded: string) {
  const [algorithm, rounds, salt, expected] = String(encoded).split('$');
  if (algorithm !== 'pbkdf2-sha256' || Number(rounds) !== iterations || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{64}$/.test(expected || '')) return false;
  const actual = await derive(password, unhex(salt), Number(rounds));
  const target = unhex(expected);
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ target[i];
  return difference === 0;
}
export default { hash, compare };
