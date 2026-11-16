import { env } from 'cloudflare:workers';
import { Buffer } from 'node:buffer';
import type { Request, Response, NextFunction } from 'express';

const MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml', 'image/bmp', 'image/x-icon', 'image/vnd.microsoft.icon', 'application/pdf']);
// Media URLs contain a random 256-bit capability. Private document URLs are
// returned only in authorized API records; possession of a URL grants access.
async function storeDataUrls(value: any): Promise<any> {
  if (typeof value === 'string') {
    const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(value);
    if (match) {
      const bytes = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
      // Browser/OS file labels can be empty, generic, or nonstandard (image/jpg).
      let contentType = match[1].toLowerCase();
      if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) contentType = 'image/png';
      else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) contentType = 'image/jpeg';
      else if (contentType === 'image/jpg' || contentType === 'image/pjpeg') contentType = 'image/jpeg';
      else if (contentType === 'image/x-png') contentType = 'image/png';
      if (!MIME.has(contentType)) throw Object.assign(new Error(`Unsupported upload format (${contentType}). Select the image again to convert it, or export it as PNG or JPEG.`), { status: 400 });
      if (bytes.length > 8 * 1024 * 1024) throw Object.assign(new Error('Each upload must be smaller than 8 MB'), { status: 413 });
      const id = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
      await env.MEDIA.put(id, bytes, { metadata: { contentType } });
      return `/api/public/media/${id}`;
    }
    // The website editor sends its draft as a JSON string inside settings.
    if (value.includes('data:') && /^[\[{]/.test(value)) {
      let parsed: any;
      try { parsed = JSON.parse(value); } catch { return value; }
      return JSON.stringify(await storeDataUrls(parsed));
    }
    return value;
  }
  if (Array.isArray(value)) {
    const result = [];
    for (const item of value) result.push(await storeDataUrls(item));
    return result;
  }
  if (value && typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) result[key] = await storeDataUrls(item);
    return result;
  }
  return value;
}

export async function mediaUploads(req: Request, res: Response, next: NextFunction) {
  try { req.body = await storeDataUrls(req.body); next(); }
  catch (err) {
    const status = (err as any).status;
    if (status) return res.status(status).json({ error: (err as Error).message });
    next(err);
  }
}

export async function mediaResponse(id: string) {
  if (!/^[a-f0-9]{64}$/.test(id)) return new Response('Not found', { status: 404 });
  const media = await env.MEDIA.getWithMetadata<{ contentType: string }>(id, 'stream');
  if (!media.value) return new Response('Not found', { status: 404 });
  const contentType = media.metadata?.contentType || 'application/octet-stream';
  return new Response(media.value, { headers: {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Cache-Control': 'private, max-age=86400',
    ...(contentType === 'application/pdf' ? { 'Content-Disposition': 'attachment; filename="document.pdf"' } : {}),
  } });
}
