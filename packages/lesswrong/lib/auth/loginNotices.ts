/**
 * Error codes passed to the /loginNotice page (as the `error` query parameter)
 * when an OAuth login fails.
 */
export const loginErrorCodes = {
  conflictingAccounts: "conflicting_accounts",
  authenticationFailed: "authentication_failed",
} as const;

/**
 * Warning codes passed to the /loginNotice page (as the `warning` query
 * parameter) when an OAuth login succeeded, but there's something the user
 * should know about.
 */
export const loginWarningCodes = {
  conflictingAccounts: "conflicting_accounts",
} as const;

export type LoginErrorCode = typeof loginErrorCodes[keyof typeof loginErrorCodes];
export type LoginWarningCode = typeof loginWarningCodes[keyof typeof loginWarningCodes];

export function getLoginErrorUrl(code: LoginErrorCode): string {
  return `/loginNotice?error=${code}`;
}

export function getLoginWarningUrl(code: LoginWarningCode, returnTo: string): string {
  const params = new URLSearchParams({ warning: code, returnTo });
  return `/loginNotice?${params.toString()}`;
}

// Placeholder origin that returnTo is resolved against. The real site origin
// isn't needed: anything that resolves to a different origin than this one
// (absolute URLs, protocol-relative URLs, javascript: URLs, etc) is rejected.
const RETURN_TO_BASE_ORIGIN = 'https://returnto.invalid';

/**
 * Only allow same-site relative paths as a post-login destination, so that the
 * returnTo parameter can't be used as an open redirect or a javascript: URL.
 * Rather than pattern-matching the string (which is easy to get wrong, since
 * URL parsers strip tabs and newlines and treat backslashes as slashes), this
 * parses it the way a browser would and returns the normalized path.
 */
export function sanitizeLoginReturnTo(returnTo: string | undefined): string {
  if (!returnTo) {
    return '/';
  }
  let parsed: URL;
  try {
    parsed = new URL(returnTo, RETURN_TO_BASE_ORIGIN);
  } catch {
    return '/';
  }
  if (parsed.origin !== RETURN_TO_BASE_ORIGIN) {
    return '/';
  }
  const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  // Dot-segment removal can turn something like "/.//evil.com" into a pathname
  // of "//evil.com", which would be protocol-relative when used as a redirect
  if (path.startsWith('//')) {
    return '/';
  }
  return path;
}
