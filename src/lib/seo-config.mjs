const PRIVATE_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/** Accept only a configured HTTPS site origin, never a local development URL. */
export function resolvePublicOrigin(candidate) {
  if (typeof candidate !== 'string' || !candidate.trim()) return undefined;

  try {
    const url = new URL(candidate.trim());
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password) return undefined;
    if (PRIVATE_HOSTS.has(hostname) || hostname.endsWith('.localhost')) return undefined;
    if (url.pathname !== '/' || url.search || url.hash) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

export const isPreviewDeployment = (environment) => environment === 'preview';

export const sitemapPaths = Object.freeze([
  '/',
  '/work',
  '/work/rewatch',
  '/work/arcus',
  '/lab',
  '/services',
  '/process',
  '/about',
  '/contact',
]);

