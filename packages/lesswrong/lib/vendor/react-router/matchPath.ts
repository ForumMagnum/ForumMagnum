// MIT License

// Copyright (c) React Training 2015-2019
// Copyright (c) Remix Software 2020-2022

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// Vendored because something about importing from `react-router` on the server was borking pingbacks,
// and we were only importing it for `matchPath`.

import PathToRegexp, { compile, pathToRegexp  } from "path-to-regexp";
// eslint-disable-next-line no-restricted-imports
import type { match, RouteProps } from "react-router";

const cache: Record<string, AnyBecauseHard> = {};
const cacheLimit = 10000;
let cacheCount = 0;

export function compilePath(path: string, options: { exact: boolean, strict: boolean, sensitive: boolean }): {
  regexp: RegExp;
  keys: PathToRegexp.Key[];
} {
  const cacheKey = `${options.exact}${options.strict}${options.sensitive}`;
  const pathCache = cache[cacheKey] || (cache[cacheKey] = {});

  if (pathCache[path]) return pathCache[path];

  const keys: PathToRegexp.Key[] = [];
  const regexp = pathToRegexp(path, keys, options);
  const result = { regexp, keys };

  if (cacheCount < cacheLimit) {
    pathCache[path] = result;
    cacheCount++;
  }

  return result;
}

/**
 * Public API for matching a URL pathname to a path.
 */
export function matchPath<Params extends { [K in keyof Params]?: string; }>(pathname: string, options: string | string[] | RouteProps = {}): match<Params> | null {
  if (typeof options === "string" || Array.isArray(options)) {
    options = { path: options };
  }

  const { path, exact = false, strict = false, sensitive = false } = options;

  const paths = ([] as (string | undefined)[]).concat(path);

  for (const path of paths) {
    if (!path && path !== "") continue;

    const { regexp, keys } = compilePath(path, {
      exact,
      strict,
      sensitive
    });
    const match = regexp.exec(pathname);

    if (!match) continue;

    const [url, ...values] = match;
    const isExact = pathname === url;

    if (exact && !isExact) continue;

    return {
      path, // the path used to match
      url: path === "/" && url === "" ? "/" : url, // the matched portion of the URL
      isExact, // whether or not we matched exactly
      params: keys.reduce((memo, key, index) => {
        memo[key.name as keyof Params] = values[index] as Params[keyof Params];
        return memo;
      }, {} as Params)
    };
  }
  
  return null;
}

export function applyParamsToPathname(pathnamePattern: string, params: {}): string {
  return compile(pathnamePattern, {validate: false})(params);
}


export default matchPath;
