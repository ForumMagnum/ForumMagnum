import { useEffect, useRef } from 'react';
import { useLocation } from '../../lib/routeUtil';
import qs from 'qs';
import omit from 'lodash/omit';

/**
 * Manages browser navigation for dialogs by:
 * 1. Adding a history entry when the dialog opens
 * 2. Handling browser back button/swipe to close the dialog
 * 3. Cleaning up the history entry when the dialog closes normally
 * 
 * This ensures that the back button closes the dialog instead of
 * navigating away from the page.
 * 
 * @param onClose - Function to call when the dialog should close
 * @param queryParam - Optional query parameter to add/remove (e.g., { key: 'modalPostId', value: 'abc123' })
 */
export const useDialogNavigation = (
  onClose: () => void,
  queryParam?: { key: string; value: string | null }
) => {
  const isClosingViaBackRef = useRef(false);
  const { query, pathname, hash } = useLocation();

  useEffect(() => {
    if (queryParam?.value) {
      if (query[queryParam.key] !== queryParam.value) {
        const newQuery = { ...query, [queryParam.key]: queryParam.value };
        const search = qs.stringify(newQuery);
        const newUrl = `${pathname}${search ? `?${search}` : ''}${hash}`;
        window.history.pushState({ dialogOpen: true }, '', newUrl);
      }
    } else if (!queryParam) {
      window.history.pushState({ dialogOpen: true }, '');
    }

    const handlePopState = () => {
      if (queryParam) {
        // Need to check actual URL state at time of popstate event
        const currentQuery = qs.parse(window.location.search.slice(1));
        if (!currentQuery[queryParam.key]) {
          isClosingViaBackRef.current = true;
          onClose();
        }
      } else {
        // Fallback mode: check history state
        if (!window.history.state?.dialogOpen) {
          isClosingViaBackRef.current = true;
          onClose();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      
      if (!isClosingViaBackRef.current) {
        if (queryParam) {
          // Get current URL state at cleanup time
          const currentQuery = qs.parse(window.location.search.slice(1));
          const queryWithoutParam = omit(currentQuery, queryParam.key);
          const search = qs.stringify(queryWithoutParam);
          const newUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
          window.history.replaceState({}, '', newUrl);
        } else if (window.history.state?.dialogOpen) {
          // Fallback mode: go back to remove the history entry
          window.history.back();
        }
      }
    };
    // run once on mount/unmount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}; 
