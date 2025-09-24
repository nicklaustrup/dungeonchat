const avatarCache = new Map();

// Returns (and caches) a fallback avatar URL (never the external photoURL)
export function getFallbackAvatar({ uid, displayName, size = 64 }) {
  const key = `${displayName || uid || 'user'}-${size}`;
  if (avatarCache.has(key)) return avatarCache.get(key);
  const safeName = encodeURIComponent(displayName || uid || 'User');
  const url = `https://ui-avatars.com/api/?name=${safeName}&background=0d8abc&color=fff&size=${size}`;
  avatarCache.set(key, url);
  return url;
}

// Legacy export (kept for backward compatibility). Returns fallback only.
export function getAvatarURL(params) {
  return getFallbackAvatar(params);
}

/** Preload an avatar URL to warm browser cache */
export function preloadAvatar(url) {
  if (!url) return;
  const img = new Image();
  img.decoding = 'async';
  img.loading = 'eager';
  img.src = url;
}

export function primeAvatarCache(users = []) {
  users.forEach(u => getFallbackAvatar(u));
}

export default getAvatarURL;