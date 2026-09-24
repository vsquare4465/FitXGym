import { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Simple in-memory rate limiter (per IP). Resets on process restart. */
export function rateLimit(options: { windowMs: number; max: number; message?: string }) {
  const { windowMs, max, message = 'Too many requests. Please try again shortly.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }

    next();
  };
}
