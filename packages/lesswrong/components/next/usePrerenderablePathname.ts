import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useContext } from 'react';

/**
 * Like usePathname, except usable during static prerendering. During
 * prerendering, parameter path segments are are given as names, not values,
 * eg "/posts/[_id]/[_slug]". At runtime, on the other hand, it will return
 * the path with values filled in, eg "/posts/12345/example-post". So the only
 * thing that is safe to do with the return value is to match it against a
 * list of routes in which bracketed parameters like [_id] are valid values,
 * and the values are not used.
 *
 * This wraps  a non-public nextjs API (LayoutRouterContext). As of nextjs 16.0,
 * there is no way to do this otherwise.  It's typechecked enough that if it
 * does break in a future nextjs version, it should at least not break silently.
 */
export function usePrerenderablePathname() {
  const layoutRouterContext = useContext(LayoutRouterContext);
  if (layoutRouterContext) {
    const pathname = layoutRouterContext.url;
    return removeQueryFrom(pathname);
  } else {
    throw new Error("No LayoutRouterContext");
  }
}

function removeQueryFrom(pathname: string) {
  if (pathname.indexOf("?") >= 0) {
    return pathname.substring(0, pathname.indexOf("?"));
  } else {
    return pathname;
  }
}
