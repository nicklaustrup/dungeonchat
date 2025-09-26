// Reply normalization utilities
export function normalizeReply(raw) {
  if (!raw) return null;
  const clean = Object.fromEntries(Object.entries(raw).filter(([_, v]) => v !== undefined));
  if (!clean.type) {
    clean.type = clean.imageURL ? 'image' : (clean.text ? 'text' : 'meta');
  }
  return clean;
}
