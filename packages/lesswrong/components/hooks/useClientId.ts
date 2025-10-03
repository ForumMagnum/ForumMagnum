import { CLIENT_ID_COOKIE } from '@/lib/cookies/cookies';
import { useCookiesWithConsent } from './useCookiesWithConsent';

// Returns the user's clientID. This is stored in a cookie separately from
// accounts; a user may have multiple clientIDs (eg if they have multiple
// devices) and a clientID may correspond to multiple users (if they log out and
// log in with a different account).
//
// A logged-out user's client ID determines which A/B test groups they are in.
// A logged-in user has their A/B test groups determined by the client ID they
// had when they created their account.
export function useClientId(): string | undefined {
  const [cookies] = useCookiesWithConsent([CLIENT_ID_COOKIE]);
  return cookies[CLIENT_ID_COOKIE];
}
