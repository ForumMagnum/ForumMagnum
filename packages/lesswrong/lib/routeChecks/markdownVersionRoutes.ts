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
  "/": () => "/api/home",
  "/about": () => "/api/about",
  "/faq": () => "/api/faq",
  "/contact": () => "/api/contact",
  "/search": () => "/api/search",
  "/community": () => "/api/community",
  "/rationality": () => "/api/rationality",
  "/rationality/[slug]": ({ slug }) => `/api/rationality/${slug}`,
  "/codex": () => "/api/codex",
  "/codex/[slug]": ({ slug }) => `/api/codex/${slug}`,
  "/hpmor": () => "/api/hpmor",
  "/hpmor/[slug]": ({ slug }) => `/api/hpmor/${slug}`,
  "/users/[slug]": ({ slug }) => `/api/user/${slug}`,
  "/w/[slug]": ({ slug }) => `/api/tag/${slug}`,
  "/events/[_id]": ({ _id }) => `/api/events/${_id}`,
  "/events/[_id]/[slug]": ({ _id, slug }) => `/api/events/${_id}/${slug}`,
  "/posts/[_id]": ({ _id }) => `/api/post/${_id}`,
  "/p/[slug]": ({ slug }) => `/api/post/${slug}`,
  // Prefer canonical _id when present to avoid stale/mismatched slugs rewriting to the wrong post.
  "/posts/[_id]/[slug]": ({ _id }) => `/api/post/${_id}`,
  "/posts/[_id]/[slug]/comment": ({ _id }) => `/api/post/${_id}/comments`,
  "/posts/[_id]/[slug]/comment/[commentId]": ({ _id, commentId }) => `/api/post/${_id}/comments/${commentId}`,
  "/posts/slug/[slug]": ({ slug }) => `/api/post/${slug}`,
  "/s/[_id]": ({ _id }) => `/api/sequence/${_id}`,
  "/s/[_id]/p/[postId]": ({ _id, postId }) => `/api/sequence/${_id}/post/${postId}`,
  "/editPost": () => "/api/editPost",
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
