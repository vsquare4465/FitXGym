/** Keep first occurrence of each image URL (prevents duplicate slides). */
export function dedupeGalleryByUrl<T extends { url: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter(item => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}
