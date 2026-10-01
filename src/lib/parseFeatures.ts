/** Parse newline- or pipe-separated feature lists from CMS settings. */
export function parseFeatureList(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw.split(/\n|\|/).map(stripFeatureTick).filter(Boolean);
}

/** Remove leading ticks so the UI icon is the only checkmark. */
export function stripFeatureTick(text: string): string {
  return String(text || '').replace(/^[\s✓✔☑✅●•\-–—*]+/, '').trim();
}
