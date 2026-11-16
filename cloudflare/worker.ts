import { env } from 'cloudflare:workers';
import { httpServerHandler } from 'cloudflare:node';
import app from '../server/app';
import { mediaResponse } from './media';

app.use((err: Error, _req: any, res: any, _next: any) => {
  console.error(err);
  const duplicate = (err as any).code === 'P2002';
  res.status(duplicate ? 409 : 500).json({ error: duplicate ? 'A record with these details already exists' : 'Internal server error' });
});
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.listen(3001);
const handler = httpServerHandler({ port: 3001 });

export default {
  async scheduled(_controller: ScheduledController, bindings: Env) {
    await bindings.DB.batch([
      bindings.DB.prepare('DELETE FROM "RateLimit" WHERE "resetAt" < ?').bind(Date.now() - 86400000),
      bindings.DB.prepare('DELETE FROM "PasswordOtp" WHERE "expiresAt" < ?').bind(Date.now() - 7 * 86400000),
    ]);
  },
  async fetch(request: Request, bindings: Env, ctx: ExecutionContext) {
    const path = new URL(request.url).pathname;
    if (request.method === 'GET' && path.startsWith('/api/public/media/')) return mediaResponse(path.slice('/api/public/media/'.length));
    if (path === '/api' || path.startsWith('/api/')) {
      if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || !env.AUTH_PEPPER || env.AUTH_PEPPER.length < 32) {
        return Response.json({ error: 'Application secrets have not been configured' }, { status: 503 });
      }
      const headers = new Headers(request.headers);
      // Use Cloudflare's verified IP, never a caller-supplied forwarding header.
      headers.set('x-forwarded-for', request.headers.get('cf-connecting-ip') || '127.0.0.1');
      headers.set('x-forwarded-proto', 'https');
      return handler.fetch(new Request(request, { headers }), bindings, ctx);
    }
    return bindings.ASSETS.fetch(request);
  },
};
