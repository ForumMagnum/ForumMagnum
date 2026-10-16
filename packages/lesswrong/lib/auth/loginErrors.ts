/**
 * Error codes passed to the /loginError page (as the `error` query parameter)
 * when an OAuth login fails.
 */
export const loginErrorCodes = {
  conflictingAccounts: "conflicting_accounts",
  authenticationFailed: "authentication_failed",
} as const;

export type LoginErrorCode = typeof loginErrorCodes[keyof typeof loginErrorCodes];

export function getLoginErrorUrl(code: LoginErrorCode): string {
  return `/loginError?error=${code}`;
}
