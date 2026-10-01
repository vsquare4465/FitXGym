/** Stock Unsplash URLs used as seed/template placeholders — not gym photos. */
export function isStockPlaceholderImage(url?: string | null): boolean {
  if (!url?.trim()) return true;
  return /unsplash\.com|images\.unsplash/i.test(url);
}

/** First real uploaded/custom image (data URL, gym domain, or non-Unsplash http). */
export function firstRealImage(...candidates: Array<string | undefined | null>): string | undefined {
  return candidates.find(url => url?.trim() && !isStockPlaceholderImage(url));
}
