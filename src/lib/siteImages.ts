/** Use only the image assigned to this slot. Empty or stock placeholders stay empty. */
export function dedicatedImage(url?: string | null): string {
  const v = url?.trim() || '';
  if (!v || /unsplash\.com|images\.unsplash/i.test(v)) return '';
  return v;
}
