import { type NextRequest, NextResponse } from 'next/server'
import { nextMiddleware } from "./packages/lesswrong/server/nextMiddleware";
import { canonicalizePath } from "./packages/lesswrong/lib/generated/routeManifest";

export function middleware(request: NextRequest) {
  // Before NextJS, we were using react-router, which wasn't case-sensitive by default.
  // To solve the problem of any existing links going to non-canonically-capitalized paths,
  // we have a codegen step that generates a trie which we use to find a matching canonical
  // path (if one exists).
  const currentPath = request.nextUrl.pathname;
  const canonical = canonicalizePath(currentPath);
  if (canonical && canonical !== currentPath) {
    const url = request.nextUrl.clone();
    url.pathname = canonical;
    return NextResponse.redirect(url, 308);
  }
  return nextMiddleware(request);
}

export const config = {
}
