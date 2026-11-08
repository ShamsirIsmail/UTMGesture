// ============================================================
// UTM Gesture Quest — Asset Resolution Utility
// Handles Vite base paths cleanly for GitHub Pages subpaths and local files
// ============================================================

/**
 * Safely resolves an asset URL respecting the Vite base path.
 * In local development, base is typically './' or '/'.
 * On GitHub Pages (e.g. /UTMGesture/), base is '/UTMGesture/'.
 */
export function getAssetUrl(path: string): string {
  if (
    !path ||
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  return `${cleanBase}${cleanPath}`;
}
