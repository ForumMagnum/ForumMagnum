import { routeTrie, type RouteNode } from '../generated/routeManifest';
import { matchPath } from '../vendor/react-router/matchPath';
import { parsePath } from './parsePath';
import { expandRoutePatternToNextRoutePatterns, routePatternToReactRouterPath } from './routePatternFormat';

interface RouteTrieMatch {
  canonicalSegments: string[];
  patternSegments: string[];
}

function nodeIsLeaf(node: RouteNode): boolean {
  return !!(node.hasPage || node.hasRoute);
}

/**
 * Walks the trie respecting Next's static-over-dynamic segment precedence,
 * but without Next's backtracking out of a static subtree that fails to
 * match, so this can return null for some obscure paths the router would
 * resolve dynamically; callers should treat null as "unknown" rather than
 * "404". Static segments match case-sensitively, like the Next router,
 * unless caseInsensitiveStatic is set.
 */
function matchPathnameAgainstRouteTrie(pathname: string, trie: RouteNode, caseInsensitiveStatic: boolean): RouteTrieMatch | null {
  const segments = parsePath(pathname).pathname.split('/').filter(Boolean);
  let node: RouteNode = trie;
  const canonicalSegments: string[] = [];
  const patternSegments: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    const canonicalSegment = caseInsensitiveStatic ? node.lowerCase?.[segment.toLowerCase()] : segment;
    const staticChild = canonicalSegment !== undefined ? node.staticChildren?.[canonicalSegment] : undefined;
    if (canonicalSegment !== undefined && staticChild) {
      canonicalSegments.push(canonicalSegment);
      patternSegments.push(canonicalSegment);
      node = staticChild;
      continue;
    }

    if (node.dynamicChild) {
      canonicalSegments.push(segment);
      patternSegments.push(`[${node.dynamicChild.paramName}]`);
      node = node.dynamicChild.child;
      continue;
    }

    if (node.catchAll) {
      canonicalSegments.push(...segments.slice(i));
      patternSegments.push(`[...${node.catchAll.paramName}]`);
      node = node.catchAll.child;
      break;
    }

    if (node.optionalCatchAll) {
      canonicalSegments.push(...segments.slice(i));
      patternSegments.push(`[[...${node.optionalCatchAll.paramName}]]`);
      node = node.optionalCatchAll.child;
      break;
    }

    return null;
  }

  if (nodeIsLeaf(node)) {
    return { canonicalSegments, patternSegments };
  }
  // An optional catch-all also matches zero remaining segments
  if (node.optionalCatchAll && nodeIsLeaf(node.optionalCatchAll.child)) {
    return {
      canonicalSegments,
      patternSegments: [...patternSegments, `[[...${node.optionalCatchAll.paramName}]]`],
    };
  }
  return null;
}

function joinSegments(segments: string[]): string {
  return segments.length ? `/${segments.join('/')}` : '/';
}

/**
 * If the pathname resolves to a route under case-insensitive matching,
 * return it with static segments in their canonical capitalization;
 * otherwise return null. Routes were case-insensitive under react-router,
 * so old links may use non-canonical capitalization.
 */
export function canonicalizePath(pathname: string): string | null {
  const match = matchPathnameAgainstRouteTrie(pathname, routeTrie, true);
  return match && joinSegments(match.canonicalSegments);
}

/**
 * The Next-format route pattern (e.g. "/w/[slug]") that the Next.js app
 * router would use for a pathname, or null if it can't be determined.
 * The trie parameter exists for tests; real callers use the default.
 */
export function getNextRoutePatternForPathname(pathname: string, trie: RouteNode = routeTrie): string | null {
  const match = matchPathnameAgainstRouteTrie(pathname, trie, false);
  return match && joinSegments(match.patternSegments);
}

/**
 * Find the first of routePatterns that matches the pathname, and the params
 * it extracts. matchPath checks each pattern in isolation, so on its own it
 * doesn't know that in the Next.js router, static routes take precedence
 * over dynamic ones — it would e.g. match /w/create (a static page) against
 * /w/[slug]. So a pattern is only accepted if it agrees with the route the
 * Next.js router would actually use, when that route can be determined.
 */
export function findNextConsistentRoutePatternMatch<Pattern extends string>(
  pathname: string,
  routePatterns: readonly Pattern[],
): { routePattern: Pattern, params: Record<string, string> } | null {
  const nextRoutePattern = getNextRoutePatternForPathname(pathname);
  for (const routePattern of routePatterns) {
    const match = matchPath<Record<string, string>>(pathname, {
      path: routePatternToReactRouterPath(routePattern),
      exact: true,
      strict: false,
    });
    if (!match) {
      continue;
    }
    if (nextRoutePattern === null || expandRoutePatternToNextRoutePatterns(routePattern).includes(nextRoutePattern)) {
      return { routePattern, params: match.params };
    }
  }
  return null;
}
