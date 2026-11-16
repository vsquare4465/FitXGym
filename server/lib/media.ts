import type { Request, Response, NextFunction } from 'express';
// Node/Postgres development retains data URLs. Workers stores bytes in KV.
export function mediaUploads(_req: Request, _res: Response, next: NextFunction) { next(); }
