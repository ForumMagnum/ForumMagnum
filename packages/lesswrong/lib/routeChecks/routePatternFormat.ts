/*
 * Functions for interconverting between routes with :param for URL parameters,
 * and routes with [param]. The :param format is used in nextjs's redirects table,
 * and internally in some route-matching code descended from when we were using
 * react-router. The [param] format is used in nextjs's app/ directory, and in the
 * generated types in .next/types/routes.d.ts.
 */

const OPTIONAL_SEGMENT_REGEX = /\/:[A-Za-z0-9_]+\?/;

export const hasOptionalColonSegment = (routePattern: string): boolean => OPTIONAL_SEGMENT_REGEX.test(routePattern);

export const colonRouteToNextRoute = (routePattern: string): string => {
  if (!routePattern.startsWith('/')) {
    throw new Error(`Route pattern must start with '/': ${routePattern}`);
  }

  if (hasOptionalColonSegment(routePattern)) {
    throw new Error(`Optional ':param?' segments must be expanded before converting to Next route format: ${routePattern}`);
  }

  return routePattern.replaceAll(/:([A-Za-z0-9_]+)([+*])?/g, (_match, paramName: string, modifier: string | undefined) => {
    if (modifier === '+') {
      return `[...${paramName}]`;
    }
    if (modifier === '*') {
      return `[[...${paramName}]]`;
    }
    return `[${paramName}]`;
  });
};

export const nextRouteToColonRoute = (routePattern: string): string => {
  if (!routePattern.startsWith('/')) {
    throw new Error(`Route pattern must start with '/': ${routePattern}`);
  }

  return routePattern
    .replaceAll(/\[\[\.\.\.([A-Za-z0-9_]+)\]\]/g, (_match, paramName: string) => `:${paramName}*`)
    .replaceAll(/\[\.\.\.([A-Za-z0-9_]+)\]/g, (_match, paramName: string) => `:${paramName}+`)
    .replaceAll(/\[([A-Za-z0-9_]+)\]/g, (_match, paramName: string) => `:${paramName}`);
};

export const routePatternToReactRouterPath = (routePattern: string): string => {
  return routePattern.includes('[') ? nextRouteToColonRoute(routePattern) : routePattern;
};
