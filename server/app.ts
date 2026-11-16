import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import dataRoutes from './routes/data.js';
import teamRoutes from './routes/team.js';
import publicRoutes from './routes/public.js';
import memberRoutes from './routes/member.js';
import { prisma } from '@fitx/db';
import { getAllowedOrigins, isProd } from '@fitx/config';
import { otpEmailConfigured, otpWhatsappConfigured } from './lib/otpDelivery.js';
const app = express();



if (process.env.TRUST_PROXY === 'true') {

  app.set('trust proxy', 1);

}



const allowedOrigins = getAllowedOrigins();

app.use(

  cors(

    isProd && allowedOrigins.length > 0

      ? { origin: allowedOrigins, credentials: true }

      : { origin: true, credentials: true },

  ),

);



app.use(express.json({ limit: '10mb' }));



if (isProd) {
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
    if (process.env.TRUST_PROXY === 'true') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });
}



app.get('/api/health', async (_req, res) => {
  let db: 'ok' | 'error' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'error';
  }
  const ok = db === 'ok';
  res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'degraded',
    env: isProd ? 'production' : 'development',
    db,
    otpEmail: otpEmailConfigured() ? 'ready' : 'missing',
    otpWhatsapp: otpWhatsappConfigured() ? 'ready' : 'missing',
    time: new Date().toISOString(),
  });
});



app.use('/api/auth', authRoutes);

app.use('/api/public', publicRoutes);

app.use('/api/member', (req, res, next) => {
  const full = (req.originalUrl || '').split('?')[0];
  if (full === '/api/member' || full.startsWith('/api/member/')) {
    return memberRoutes(req, res, next);
  }
  next();
});

app.use('/api/team', teamRoutes);

app.use('/api', (req, res, next) => {
  const p = req.path;
  if (
    p === '/auth' || p.startsWith('/auth/') ||
    p === '/public' || p.startsWith('/public/') ||
    p === '/member' || p.startsWith('/member/') ||
    p === '/team' || p.startsWith('/team/')
  ) {
    return res.status(404).json({ error: 'Not found' });
  }
  next();
});

app.use('/api', dataRoutes);




export default app;
