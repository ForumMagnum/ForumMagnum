import { useMemo, useCallback } from 'react';
import { useCookiesWithConsent } from './useCookiesWithConsent';

const removeExpiredIds = (collections: Record<string, string>) => {
  const now = new Date().getTime();
  return Object.fromEntries(
    Object.entries(collections).filter(
      ([, expiryDate]) => new Date(expiryDate).getTime() > now
    )
  );
};

/**
 * A custom hook for hiding elements based on an id and cookie.
 * It returns a boolean indicating whether the element should be hidden,
 * and a function to hide the element until the specified expiry date.
 *
 * @param {string} cookieName - The name of the cookie to store hidden element ids.
 * @param {string} id - The id of the element to check for hiding.
 * @returns {[boolean, (expiryDate: Date) => void]} - A tuple with the hidden status and a hideUntil function.
 */
export const useHideWithCookie = (cookieName: string, id: string): [boolean, (expiryDate: Date) => void] => {
  const [cookies, setCookie] = useCookiesWithConsent();

  const isHidden = useMemo(() => {
    const hiddenCollections: Record<string, string> = cookies[cookieName]
      ? JSON.parse(cookies[cookieName])
      : {};
    const nonExpiredHiddenCollections = removeExpiredIds(hiddenCollections);
    return nonExpiredHiddenCollections.hasOwnProperty(id);
  }, [cookies, cookieName, id]);

  const hideUntil = useCallback((expiryDate: Date) => {
    const hiddenIds: Record<string, string> = cookies[cookieName]
      ? JSON.parse(cookies[cookieName])
      : {};
    const updatedHiddenCollections = {
      ...removeExpiredIds(hiddenIds),
      [id]: expiryDate.toISOString(),
    };
    setCookie(cookieName, JSON.stringify(updatedHiddenCollections), {
      expires: expiryDate,
      path: '/',
    });
  }, [cookies, cookieName, id, setCookie]);

  return [isHidden, hideUntil];
};
