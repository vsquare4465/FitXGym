import 'dotenv/config';

import fs from 'fs';

import path from 'path';

import express from 'express';
import app from './app.js';

import cors from 'cors';

import authRoutes from './routes/auth.js';

import dataRoutes from './routes/data.js';

import teamRoutes from './routes/team.js';

import publicRoutes from './routes/public.js';

import memberRoutes from './routes/member.js';

import { prisma } from '@fitx/db';
import { distPath, getAllowedOrigins, isProd, port, validateProductionEnv } from '@fitx/config';
import { ensureProductionOwners } from './lib/ensureOwner.js';
import { otpEmailConfigured, otpWhatsappConfigured } from './lib/otpDelivery.js';



validateProductionEnv();



if (isProd) {

  if (!fs.existsSync(distPath)) {

    console.error(`Production build not found at ${distPath}. Run: npm run build`);

    process.exit(1);

  }



  app.use(express.static(distPath, { maxAge: '1d', index: false }));



  app.get('/{*path}', (req, res, next) => {

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
    ensureProductionOwners().catch(err => {
      console.error('Failed to ensure owner accounts:', err);
    });
  } else {
    console.log(`API health: http://localhost:${port}/api/health`);
    ensureProductionOwners().catch(err => {
      console.error('Failed to ensure owner accounts:', err);
    });
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
