import { GalleryImage } from '../types';

export const WEBSITE_DRAFT_KEY = 'websiteDraft';

export interface WebsiteDraftPayload {
  settings: Record<string, string>;
  gallery: GalleryImage[];
  updatedAt?: string;
  publishedAt?: string;
}

export function parseWebsiteDraft(raw?: string): WebsiteDraftPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as WebsiteDraftPayload;
    if (parsed?.settings && typeof parsed.settings === 'object') return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function stripInternalSettings(settings: Record<string, string>): Record<string, string> {
  const { [WEBSITE_DRAFT_KEY]: _, ...rest } = settings;
  return rest;
}

export function serializeWebsiteDraft(settings: Record<string, string>, gallery: GalleryImage[]): string {
  return JSON.stringify({
    settings,
    gallery,
    updatedAt: new Date().toISOString(),
  } satisfies WebsiteDraftPayload);
}
