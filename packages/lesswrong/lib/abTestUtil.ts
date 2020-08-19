import { useContext } from 'react';
import { ABTest, ABTestGroupsContext, getAllUserABTestGroups, getUserABTestGroup, RelevantTestGroupAllocation, CompleteTestGroupAllocation } from './abTestImpl';
import { useCookies } from 'react-cookie'
import { useCurrentUser } from '../components/common/withUser';

// Returns the name of the A/B test group that the current user/client is in.
export function useABTest(abtest: ABTest): string {
  const currentUser = useCurrentUser();
  const clientId = useClientId();
  const abTestGroups: RelevantTestGroupAllocation = useContext(ABTestGroupsContext);
  const group = getUserABTestGroup(currentUser, clientId, abtest);
  
  abTestGroups[abtest.name] = group;
  return group;
}

// Returns the user's clientID. This is stored in a cookie separately from
// accounts; a user may have multiple clientIDs (eg if they have multiple
// devices) and a clientID may correspond to multiple users (if they log out and
// log in with a different account).
//
// A logged-out user's client ID determines which A/B test groups they are in.
// A logged-in user has their A/B test groups determined by the client ID they
// had when they created their account.
export function useClientId(): string {
  const [cookies] = useCookies(['clientId']);
  return cookies.clientId;
}

// Return a complete mapping of A/B test names to A/B test groups. This is used
// on the page that shows you what A/B tests you're in; it should otherwise be
// avoided, since it interferes with caching.
export function useAllABTests(): CompleteTestGroupAllocation {
  const currentUser = useCurrentUser();
  const clientId = useClientId();
  
  const abTestGroups: CompleteTestGroupAllocation = useContext(ABTestGroupsContext);
  
  const testGroups = getAllUserABTestGroups(currentUser, clientId);
  for (let abTestKey in testGroups)
    abTestGroups[abTestKey] = testGroups[abTestKey];
  
  return testGroups;
}
