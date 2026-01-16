import { useCallback, useEffect } from "react";
import { useCurrentUser } from "../common/withUser";
import { useCookiesWithConsent } from "../hooks/useCookiesWithConsent";
import { userIsMemberOf } from "../../lib/vulcan-users/permissions";

const PREFER_NEW_SITE_COOKIE = 'prefer_ea_forum_v3';

/**
 * Hook for managing the EA Forum V3 preference during strangler fig migration.
 * Clears the cookie automatically if the user is not a real admin.
 */
export const useEAForumV3 = (): {
  preferNewSite: boolean;
  setPreferNewSite: (value: boolean) => void;
} => {
  const currentUser = useCurrentUser();
  const [cookies, setCookie, removeCookie] = useCookiesWithConsent([PREFER_NEW_SITE_COOKIE]);

  const preferNewSite = cookies[PREFER_NEW_SITE_COOKIE] === 'true';
  const isRealAdmin = userIsMemberOf(currentUser, "realAdmins");

  // Clear the cookie if user is not a real admin
  useEffect(() => {
    if (!isRealAdmin) {
      removeCookie(PREFER_NEW_SITE_COOKIE, { path: '/' });
    }
  }, [isRealAdmin, removeCookie]);

  const setPreferNewSite = useCallback((value: boolean) => {
    if (value) {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      setCookie(PREFER_NEW_SITE_COOKIE, 'true', { path: '/', expires: oneYearFromNow });
    } else {
      removeCookie(PREFER_NEW_SITE_COOKIE, { path: '/' });
    }
    window.location.reload();
  }, [setCookie, removeCookie]);

  return {
    preferNewSite,
    setPreferNewSite,
  };
};
