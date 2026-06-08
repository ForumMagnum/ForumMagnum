import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReviewGroup } from './groupings';
import type { InboxAction } from './inboxReducer';

// New-content users start out in the New Content tab; as each user's content
// loads client-side, the probes report (via handlePangramProbeResult) whether
// they qualify for the Pangram tab, and qualifying users migrate over. The
// qualifying IDs are mirrored into reducer state so keyboard tab navigation
// stays in sync.
export function usePangramQualification(
  groupedUsers: Partial<Record<ReviewGroup, SunshineUsersList[]>>,
  dispatch: React.Dispatch<InboxAction>
) {
  const newContentUsers = useMemo(() => groupedUsers.newContent ?? [], [groupedUsers]);

  const [pangramQualification, setPangramQualification] = useState<Record<string, boolean>>({});

  const handlePangramProbeResult = useCallback((userId: string, qualifies: boolean) => {
    setPangramQualification(prev => (prev[userId] === qualifies ? prev : { ...prev, [userId]: qualifies }));
  }, []);

  const pangramQualifyingUserIds = useMemo(
    () => newContentUsers.filter(user => pangramQualification[user._id]).map(user => user._id),
    [newContentUsers, pangramQualification]
  );

  useEffect(() => {
    dispatch({ type: 'SET_PANGRAM_QUALIFYING_USERS', userIds: pangramQualifyingUserIds });
  }, [pangramQualifyingUserIds, dispatch]);

  return {
    newContentUsers,
    handlePangramProbeResult,
    pangramQualifyingUserIds,
  };
}
