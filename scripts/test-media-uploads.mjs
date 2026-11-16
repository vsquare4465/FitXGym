import assert from 'node:assert/strict';
import fs from 'node:fs';
import { transform } from 'esbuild';

const stored = [];
globalThis.__mediaTestEnv = { MEDIA: { put: async (_id, bytes, options) => stored.push({ bytes, ...options }) } };
const source = fs.readFileSync('cloudflare/media.ts', 'utf8').replace("import { env } from 'cloudflare:workers';", 'const env = globalThis.__mediaTestEnv;');
const { code } = await transform(source, { loader: 'ts', format: 'esm', target: 'es2022' });
const { mediaUploads } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
async function upload(body) {
  const req = { body }; let status = 200; let error;
  await mediaUploads(req, { status(s) { status = s; return this; }, json(e) { error = e; } }, e => { if (e) throw e; });
  return { body: req.body, status, error };
}
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
for (const label of ['image/png', 'image/x-png', 'application/octet-stream', 'IMAGE/PNG']) {
  const result = await upload({ logoUrl: `data:${label};base64,${png}` });
  assert.equal(result.status, 200); assert.match(result.body.logoUrl, /^\/api\/public\/media\/[a-f0-9]{64}$/);
  assert.equal(stored.at(-1).metadata.contentType, 'image/png');
  assert.deepEqual(stored.at(-1).bytes, Buffer.from(png, 'base64'));
}
const jpeg = Buffer.from([255,216,255,224,0,16,74,70,73,70]);
assert.equal((await upload({ photo: `data:application/octet-stream;base64,${jpeg.toString('base64')}` })).status, 200);
assert.equal(stored.at(-1).metadata.contentType, 'image/jpeg');
const draft = await upload({ websiteDraft: JSON.stringify({ settings: { logoUrl: `data:image/x-png;base64,${png}` } }) });
assert.match(JSON.parse(draft.body.websiteDraft).settings.logoUrl, /^\/api\/public\/media\//);
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>').toString('base64');
assert.equal((await upload({ logo: `data:image/svg+xml;base64,${svg}` })).status, 200);
assert.equal((await upload({ logo: 'data:text/html;base64,PGgxPm5vPC9oMT4=' })).status, 400);
assert.equal((await upload({ photo: `data:image/png;base64,${Buffer.alloc(8*1024*1024+1).toString('base64')}` })).status, 413);
console.log('PASS: image MIME aliases, PNG/JPEG content detection, nested drafts, SVG, invalid types, and size limit.');
delete globalThis.__mediaTestEnv;
