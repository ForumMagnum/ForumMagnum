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

/**
 * Only allow same-site relative paths as a post-login destination, so that the
 * returnTo parameter can't be used as an open redirect.
 */
export function sanitizeLoginReturnTo(returnTo: string | undefined): string {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//') || returnTo.startsWith('/\\')) {
    return '/';
  }
  return returnTo;
}
