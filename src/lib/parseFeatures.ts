/** Parse newline- or pipe-separated feature lists from CMS settings. */
export function parseFeatureList(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw.split(/\n|\|/).map(s => s.trim()).filter(Boolean);
}
