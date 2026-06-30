import { useCallback } from "react";
import { useCurrentUser } from "../common/withUser";
import { useCookiesWithConsent } from "../hooks/useCookiesWithConsent";
import { userIsAdminOrMod, userIsMemberOf } from "../../lib/vulcan-users/permissions";

const PREFER_NEW_SITE_COOKIE = 'prefer_ea_forum_v3';

/**
 * Hook for managing the EA Forum V3 preference during strangler fig migration.
 * Toggle is shown to admins.
 */
export const useEAForumV3 = (): {
  preferNewSite: boolean;
  setPreferNewSite: (value: boolean) => void;
  showNewSiteToggle: boolean;
} => {
  const currentUser = useCurrentUser();
  const [cookies, setCookie] = useCookiesWithConsent([PREFER_NEW_SITE_COOKIE]);

  const preferNewSite = cookies[PREFER_NEW_SITE_COOKIE] === 'true';
  const showNewSiteToggle = userIsMemberOf(currentUser, "realAdmins") ||
    userIsAdminOrMod(currentUser);

  const setPreferNewSite = useCallback((value: boolean) => {
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    setCookie(PREFER_NEW_SITE_COOKIE, value ? 'true' : 'false', {
      path: '/',
      expires: oneYearFromNow,
    });
    window.location.reload();
  }, [setCookie]);

  return {
    preferNewSite,
    setPreferNewSite,
    showNewSiteToggle,
  };
};
