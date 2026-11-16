import { env } from 'cloudflare:workers';
import type { Request, Response, NextFunction } from 'express';

/** D1-backed limits are shared across isolates and survive Worker restarts. */
export function rateLimit(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = 'Too many requests. Please try again shortly.' } = options;
  const scope = `${windowMs}:${max}:${message}`;
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const now = Date.now();
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${env.JWT_SECRET}:${req.ip}:${scope}`));
      const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
      const row = await env.DB.prepare(`INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (?, 1, ?)
        ON CONFLICT("key") DO UPDATE SET
        "count" = CASE WHEN "resetAt" <= ? THEN 1 ELSE "count" + 1 END,
        "resetAt" = CASE WHEN "resetAt" <= ? THEN excluded."resetAt" ELSE "resetAt" END
        RETURNING "count", "resetAt"`).bind(key, now + windowMs, now, now).first<{ count: number; resetAt: number }>();
      if (row && row.count > max) {
        res.setHeader('Retry-After', String(Math.ceil((row.resetAt - now) / 1000)));
        return res.status(429).json({ error: message });
      }
      next();
    } catch (err) { next(err); }
  };
}
