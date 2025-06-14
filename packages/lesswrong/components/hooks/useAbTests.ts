import type { ABTest } from '@/lib/abTestClass';
import { useClientId, ABTestGroupsUsedContext, getUserABTestGroup, CompleteTestGroupAllocation, getAllUserABTestGroups } from '@/lib/abTestImpl';
import { useContext } from 'react';
import { useCurrentUser } from '../common/withUser';


// Returns the name of the A/B test group that the current user/client is in.
// `forceGroup` is a way to conveniently bypass this (for logged out users), to
// make the page suitable for caching.
export function useABTest<Group extends string>(abtest: ABTest<Group>, forceGroup?: string): Group {
  const currentUser = useCurrentUser();
  const clientId = useClientId();
  const abTestGroupsUsed = useContext(ABTestGroupsUsedContext);

  if (forceGroup) {
    return forceGroup as Group;
  }

  const group = getUserABTestGroup(currentUser ? { user: currentUser } : { clientId }, abtest);

  abTestGroupsUsed[abtest.name] = group;
  return group;
}

// Return a complete mapping of A/B test names to A/B test groups. This is used
// on the page that shows you what A/B tests you're in; it should otherwise be
// avoided, since it interferes with caching.
export function useAllABTests(): CompleteTestGroupAllocation {
  const currentUser = useCurrentUser();
  const clientId = useClientId();

  const abTestGroupsUsed: CompleteTestGroupAllocation = useContext(ABTestGroupsUsedContext);

  const testGroups = getAllUserABTestGroups(currentUser ? { user: currentUser } : { clientId });
  for (let abTestKey in testGroups)
    abTestGroupsUsed[abTestKey] = testGroups[abTestKey];

  return testGroups;
}

