import Cookies from 'universal-cookie';
import { captureException } from '@sentry/core';
import { isServer } from './executionEnvironment';

// Strangler Fig Migration Utilities
//
// These utilities help determine whether to use SPA navigation or full page
// navigation based on cookies set by the new site's proxy.
//
// Cookie "prefer_ea_forum_v3": "true" if user has opted into new site
// Cookie "ea_forum_v3_owned_routes": JSON blob with patterns for routes owned by new site

interface OwnedRoutesPayload {
  v: number;
  patterns: string[];
}

export function isRouteOwnedByEAForumV3(href: string): boolean {
  if (isServer) return false;

  const cookies = new Cookies();

  const preferNewSite = cookies.get('prefer_ea_forum_v3');
  if (preferNewSite !== 'true') {
    return false;
  }

  const ownedRoutesRaw = cookies.get('ea_forum_v3_owned_routes');
  if (!ownedRoutesRaw) {
    // User wants new site but we don't have route info yet => use SPA nav
    return false;
  }

  let payload: OwnedRoutesPayload;
  try {
    payload = typeof ownedRoutesRaw === 'string'
      ? JSON.parse(ownedRoutesRaw)
      : ownedRoutesRaw;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Error parsing ea_forum_v3_owned_routes cookie:", e);
    captureException(e);
    return false;
  }

  return payload.patterns.some(p => new RegExp(p).test(href));
}
