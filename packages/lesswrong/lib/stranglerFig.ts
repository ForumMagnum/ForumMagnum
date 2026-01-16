import { isServer } from './executionEnvironment';

/**
 * Strangler Fig Migration Utilities
 *
 * These utilities help determine whether to use SPA navigation or full page
 * navigation based on cookies set by the new site's proxy.
 *
 * Cookie: prefer_ea_forum_v2 - "true" if user has opted into new site
 * Cookie: ea_forum_v2_owned_routes - JSON blob with patterns for routes owned by new site
 */

interface OwnedRoutesPayload {
  v: number;
  patterns: string[];
}

// Cache parsed patterns to avoid re-parsing on every navigation
let cachedPatterns: RegExp[] | null = null;
let cachedCookieValue: string | null = null;

function getCookie(name: string): string | null {
  if (isServer) return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) {
    try {
      return decodeURIComponent(match[2]);
    } catch {
      return match[2];
    }
  }
  return null;
}

function getPathnameFromHref(href: string): string {
  try {
    // Handle both absolute and relative URLs
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return new URL(href).pathname;
    }
    // For relative URLs, extract pathname (before ? and #)
    const withoutHash = href.split('#')[0];
    const withoutQuery = withoutHash.split('?')[0];
    return withoutQuery || '/';
  } catch {
    return href;
  }
}

/**
 * Check if a route is owned by the new site.
 * Returns true if the user has opted into the new site AND the route matches
 * one of the patterns in the owned routes cookie.
 */
export function isRouteOwnedByNewSite(href: string): boolean {
  if (isServer) return false;

  // Check if user has opted into the new site
  // TODO use standard cookie utils
  const preferNewSite = getCookie('prefer_ea_forum_v2');
  if (preferNewSite !== 'true') {
    return false;
  }

  // Get the owned routes from cookie
  const ownedRoutesRaw = getCookie('ea_forum_v2_owned_routes');
  if (!ownedRoutesRaw) {
    // User wants new site but we don't have route info yet - use SPA nav
    return false;
  }

  // Parse and cache the patterns
  if (ownedRoutesRaw !== cachedCookieValue) {
    try {
      const payload: OwnedRoutesPayload = JSON.parse(ownedRoutesRaw);
      if (payload.v !== 1) {
        // Unknown version - play it safe, use SPA nav
        console.warn('Unknown ea_forum_v2_owned_routes version:', payload.v);
        return false;
      }
      cachedPatterns = payload.patterns.map(p => new RegExp(p));
      cachedCookieValue = ownedRoutesRaw;
    } catch (e) {
      console.error('Failed to parse ea_forum_v2_owned_routes:', e);
      return false;
    }
  }

  // Extract pathname from href (ignore query params and hash)
  const pathname = getPathnameFromHref(href);

  // Check if pathname matches any pattern
  return cachedPatterns?.some(pattern => pattern.test(pathname)) ?? false;
}
