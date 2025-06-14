import { isServer } from '@/lib/executionEnvironment';
import { useState, useEffect } from 'react';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';


/**
 * Return the current user's location, by checking a few places.
 *
 * If the user is logged in, the location specified in their account settings is used first.
 * If the user is not logged in, then no location is available for server-side rendering,
 * but we can check if we've already saved a location in their browser's local storage.
 *
 * If we've failed to get a location for the user, finally try to get a location
 * client-side using the browser geolocation API.
 * (This won't necessarily work, since not all browsers and devices support it, and it requires user permission.)
 * This step is skipped if the "dontAsk" flag is set, to be less disruptive to the user
 * (for example, on the forum homepage).
 *
 * @param {UsersCurrent|DbUser|null} currentUser - The user we are checking.
 * @param {boolean} dontAsk - Flag that prevents us from asking the user for their browser's location.
 *
 * @returns {Object} locationData
 * @returns {number} locationData.lat - The user's latitude.
 * @returns {number} locationData.lng - The user's longitude.
 * @returns {boolean} locationData.loading - Indicates that we might have a known location later.
 * @returns {boolean} locationData.known - If false, then we're returning the default location instead of the user's location.
 * @returns {string} locationData.label - The string description of the location (ex: Cambridge, MA, USA).
 * @returns {Function} locationData.setLocationData - Function to set the location directly.
 */
export const useUserLocation = (currentUser: UsersCurrent | DbUser | null, dontAsk?: boolean): {
  lat: number;
  lng: number;
  loading: boolean;
  known: boolean;
  label: string;
  setLocationData: Function;
} => {
  // default is Berkeley, CA
  const placeholderLat = 37.871853;
  const placeholderLng = -122.258423;
  const defaultLocation = { lat: placeholderLat, lng: placeholderLng, loading: false, known: false, label: null };

  const currentUserLat = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[1];
  const currentUserLng = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[0];

  const [locationData, setLocationData] = useState(() => {
    if (currentUserLat && currentUserLng) {
      // First return a location from the user profile, if set
      return { lat: currentUserLat, lng: currentUserLng, loading: false, known: true, label: currentUser?.location };
    } else if (isServer) {
      // If there's no location in the user profile, we may still be able to get
      // a location from the browser--but not in SSR.
      return { lat: placeholderLat, lng: placeholderLng, loading: true, known: false, label: null };
    } else {
      // If we're on the browser, and the user isn't logged in, see if we saved it in local storage
      const ls = getBrowserLocalStorage();
      if (!currentUser && ls) {
        try {
          const storedUserLocation = ls.getItem('userlocation');
          const lsLocation = storedUserLocation ? JSON.parse(storedUserLocation) : null;
          if (lsLocation) {
            return { ...lsLocation, loading: false };
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);
        }
      }
      // If we couldn't get it from local storage, we'll try to get a location using the browser
      // geolocation API. This is not always available.
      if (!dontAsk && typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator && navigator.geolocation) {
        return { lat: placeholderLat, lng: placeholderLng, loading: true, known: false, label: null };
      }
    }

    return defaultLocation;
  });

  useEffect(() => {
    // if we don't yet have a location for the user and we're on the browser,
    // try to get the browser location
    if (!dontAsk &&
      !locationData.known &&
      !isServer &&
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      navigator &&
      navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        if (position && position.coords) {
          const navigatorLat = position.coords.latitude;
          const navigatorLng = position.coords.longitude;
          // label (location name) needs to be filled in by the caller
          setLocationData({ lat: navigatorLat, lng: navigatorLng, loading: false, known: true, label: '' });
        } else {
          setLocationData(defaultLocation);
        }
      },
        (error) => {
          setLocationData(defaultLocation);
        }
      );
    }
    //No exhaustive deps because this is supposed to run only on mount
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...locationData, setLocationData };
};
