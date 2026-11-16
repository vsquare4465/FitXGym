/**
 * Old Cloudflare Pages proxy. The live app is the fitx-gym Worker
 * (see wrangler.jsonc). This function only forwards if API_ORIGIN is set
 * to that Worker during a DNS cutover. It does not call Render.
 */
export async function onRequest(context) {
  const origin = String(context.env?.API_ORIGIN || '').replace(/\/$/, '');
  if (!origin) {
    return new Response(
      JSON.stringify({
        error: 'This Pages project no longer serves Fit X Gym. Open the fitx-gym Worker URL.',
      }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }

  const incoming = new URL(context.request.url);
  const target = `${origin}${incoming.pathname}${incoming.search}`;
  const headers = new Headers(context.request.headers);
  headers.delete('host');
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');
  headers.delete('content-length');

  const method = context.request.method.toUpperCase();
  const init = { method, headers, redirect: 'manual' };
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = context.request.body;
  }
  return fetch(target, init);
}
