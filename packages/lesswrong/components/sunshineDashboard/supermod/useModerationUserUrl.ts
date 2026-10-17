import { useEffect, useRef } from 'react';
import { useNavigate } from '@/lib/routeUtil';

export function useModerationUserUrl(openedUserId: string | null) {
  const navigate = useNavigate();
  const previousOpenedUserId = useRef(openedUserId);

  useEffect(() => {
    // Incoming navigation can update the location before the old inbox unmounts.
    // Only a selection change inside this inbox should write back to the URL.
    if (previousOpenedUserId.current === openedUserId) return;
    previousOpenedUserId.current = openedUserId;

    navigate(currentLocation => {
      if (currentLocation.pathname !== '/admin/supermod') return currentLocation.location;
      const search = new URLSearchParams(currentLocation.location.search);
      if (openedUserId) {
        search.set('user', openedUserId);
      } else {
        search.delete('user');
      }
      return { ...currentLocation.location, search: search.toString() ? `?${search}` : '' };
    }, { replace: true, skipRouter: true });
  }, [openedUserId, navigate]);
}
