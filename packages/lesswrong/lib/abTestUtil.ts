import React, { useContext } from 'react';
import { ABTest, ABTestGroupsContext, getAllUserABTestGroups, getUserABTestGroup } from './abTestImpl';
import { useCookies } from 'react-cookie'
import { useCurrentUser } from '../components/common/withUser';

export function useABTest(abtest: ABTest): string {
  const currentUser = useCurrentUser();
  const clientId = useClientId();
  const abTestGroups: Record<string,string> = useContext(ABTestGroupsContext);
  const group = getUserABTestGroup(currentUser, clientId, abtest);
  
  abTestGroups[abtest.name] = group;
  return group;
}

export function useClientId(): string {
  const [cookies] = useCookies(['clientId']);
  return cookies.clientId;
}

export function useAllABTests(): Record<string,string> {
  const currentUser = useCurrentUser();
  const clientId = useClientId();
  
  const abTestGroups: Record<string,string> = useContext(ABTestGroupsContext);
  
  const testGroups = getAllUserABTestGroups(currentUser, clientId);
  for (let abTestKey in testGroups)
    abTestGroups[abTestKey] = testGroups[abTestKey];
  
  return testGroups;
}
