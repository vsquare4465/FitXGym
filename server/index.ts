import 'dotenv/config';

import fs from 'fs';

import path from 'path';

import express from 'express';

import cors from 'cors';

import authRoutes from './routes/auth.js';

import dataRoutes from './routes/data.js';

import teamRoutes from './routes/team.js';

import publicRoutes from './routes/public.js';

import memberRoutes from './routes/member.js';

import { prisma } from './db.js';
import { distPath, getAllowedOrigins, isProd, port, validateProductionEnv } from './lib/config.js';



validateProductionEnv();



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
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
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
    time: new Date().toISOString(),
  });
});



app.use('/api/auth', authRoutes);

app.use('/api/public', publicRoutes);

app.use('/api/member', memberRoutes);

app.use('/api/team', teamRoutes);

app.use('/api', dataRoutes);



if (isProd) {

  if (!fs.existsSync(distPath)) {

    console.error(`Production build not found at ${distPath}. Run: npm run build`);

    process.exit(1);

  }



  app.use(express.static(distPath, { maxAge: '1d', index: false }));



  app.get('*', (req, res, next) => {

    if (req.path.startsWith('/api')) return next();

    res.sendFile(path.join(distPath, 'index.html'), err => {

      if (err) next(err);

    });

  });

}



app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {

  console.error(err);

  res.status(500).json({ error: isProd ? 'Internal server error' : err.message });

});



const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Fit X Gym ${isProd ? 'production' : 'API'} server on http://0.0.0.0:${port}`);
  if (isProd) {
    console.log('Serving website + API from single process');
  } else {
    console.log(`API health: http://localhost:${port}/api/health`);
  }
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\nPort ${port} is already in use.`);
    console.error('Run: npm run dev:kill');
    console.error('Then: npm run dev\n');
  } else {
    console.error('Server failed to start:', err.message);
  }
  process.exit(1);
});


