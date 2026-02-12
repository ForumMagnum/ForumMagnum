import type { ParamMap } from "../../../../.next/types/routes";
import { matchPath } from "../vendor/react-router/matchPath";
import { routePatternToReactRouterPath } from "./routePatternFormat";

type NextExistingRoute = keyof ParamMap;

type MarkdownRouteMapping = Partial<{
  [TRoutePattern in NextExistingRoute]: (params: ParamMap[TRoutePattern]) => string;
}>;

const defineMarkdownRouteMapping = <const TRouteMapping extends MarkdownRouteMapping>(
  routeMarkdownMapping: TRouteMapping
) => routeMarkdownMapping;

export const routeMarkdownMapping = defineMarkdownRouteMapping({
  "/posts/[_id]": ({ _id }) => `/api/post/${_id}`,
  "/posts/[_id]/[slug]": ({ _id, slug }) => `/api/post/${slug || _id}`,
  "/posts/slug/[slug]": ({ slug }) => `/api/post/${slug}`,
});

export type MarkdownVersionRoutePattern = keyof typeof routeMarkdownMapping;

type MarkdownRoutePattern = keyof typeof routeMarkdownMapping;
type MarkdownRouteEntries = [MarkdownRoutePattern, (params: Record<string, string>) => string][];

const routeMarkdownEntries = Object.entries(routeMarkdownMapping) as MarkdownRouteEntries;

export function getMarkdownPathname(pathname: string): string | null {
  for (const [routePattern, getMarkdownRoutePath] of routeMarkdownEntries) {
    const match = matchPath<Record<string, string>>(pathname, {
      path: routePatternToReactRouterPath(routePattern),
      exact: true,
      strict: false,
    });
    if (match?.params) {
      return getMarkdownRoutePath(match.params);
    }
  }
  return null;
}
