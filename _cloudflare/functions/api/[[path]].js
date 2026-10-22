const RENDER_ORIGIN = 'https://fitx-gym.onrender.com';

/** Proxy /api/* from Cloudflare Pages to the Render app (Postgres + admin). */
export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  const origin = String(context.env?.API_ORIGIN || RENDER_ORIGIN).replace(/\/$/, '');
  const target = `${origin}${incoming.pathname}${incoming.search}`;

  const headers = new Headers(context.request.headers);
  headers.delete('host');
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-ray');
  headers.delete('cf-visitor');
  headers.delete('content-length');

  const method = context.request.method.toUpperCase();
  const init = {
    method,
    headers,
    redirect: 'manual',
  };
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = context.request.body;
  }

  return fetch(target, init);
}
