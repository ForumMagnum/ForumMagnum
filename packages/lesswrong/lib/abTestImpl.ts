'use client';

import React from 'react';
import rng from './seedrandom';
import { CLIENT_ID_COOKIE } from './cookies/cookies';
import { useCookiesWithConsent } from '../components/hooks/useCookiesWithConsent';
import { randomId } from './random';
import keyBy from 'lodash/keyBy';
import { allABTests } from './abTests';
import type { ABTest, ABTestGroup } from './abTestClass';

//
// A/B tests. Each A/B test has a name (which should be unique across all A/B
// tests across all time), a set of groups (identified by strings), and a
// weighting for each group (representing the probability that a given user is
// in that group). A given user (or logged-out client) is in exactly one of the
// groups.
//
// As a user, you can see and override what A/B test groups you're in by going to
//   /abTestGroups
//
// Logged-out users are assigned an A/B test group based on their ClientID. If
// they create a new account, that account inherits the test groups of the
// ClientID through which the account was created. Users created before A/B
// tests (and anyone missing AB test key for some other reason) had their AB tesk 
// key populated with their userId on 2023-12-05 for LW. On pageload, which group a user 
// is in is fixed for that tab; logging out and logging in as a different user 
// doesn't switch them to that user's A/B test group until they refresh or open 
// a new tab.
//
// A/B tests can be overridden server-wide, eg to end an A/B test and put
// everyone in the winning group, by writing an abTestOverride value into the
// databaseMetadata collection. A/B tests can be overridden for an individual
// user by settings the abTestOverrides field on the user object. The override
// will only apply while they are logged in.
//
// To change JSS styles based on A/B test group, use the styleIfInGroup method,
// nested inside the JSS for a className, similar to how you would make a
// layout breakpoint. For example:
//   submitButton: {
//     width: 80,
//     marginLeft: 10,
//     [buttonColorABTest.styleIfInGroup("redButtonGroup")]: {
//       color: "red",
//     },
//   },
// Under the hood, what happens is that the <body> element has classes applied
// for all of the user's A/B test groups, and this creates a CSS descendent
// selector. A/B tests that only affect styles do not interfere with the page
// cache.
//
// To change the behavior of a component based on the user's A/B test group,
// use the useABTest hook. For example:
//   const showButtonGroup = useABTest(showButtonABTest);
//   return <div>
//     {showButtonGroup==="visible" && <ButtonThatMightOrMightNotAppear/>
//   </div>
//
//

type ABKeyInfo = {
  /**
   * clientId can now be undefined on the server, in the case where a new user's first request is
   * to a cache friendly page (we can't add a "set-cookie" to the response, so it is generated as
   * soon as the client initialises instead)
   */
  clientId?: string
} | {
  user: DbUser | UsersCurrent
}

// CompleteTestGroupAllocation: A dictionary from the names of A/B tests, to
// which group a user is in, which is complete (includes all of the A/B tests
// that are defined).
export type CompleteTestGroupAllocation = Record<string,string>

// RelevantTestGroupAllocation: A dictionary from the names of A/B tests to
// which group a user is in, which is pruned to only the tests which affected
// a particular page render.
export type RelevantTestGroupAllocation = Record<string,string>

// Used for tracking which A/B test groups were relevant to the page rendering
export const ABTestGroupsUsedContext = React.createContext<RelevantTestGroupAllocation>({});

export function getABTestsMetadata(): Record<string,ABTest> {
  return keyBy(allABTests, ab=>ab.name);
}

export function getUserABTestKey(abKeyInfo: ABKeyInfo): string | undefined {
  if ('user' in abKeyInfo) {
    return abKeyInfo.user.abTestKey ?? undefined;
  } else {
    return abKeyInfo.clientId;
  }
}

export function getUserABTestGroup<Groups extends string>(abKeyInfo: ABKeyInfo, abTest: ABTest<Groups>): Groups {
  const abTestKey = getUserABTestKey(abKeyInfo);
  const groupWeights = Object.fromEntries(
    Object
      .entries(abTest.groups)
      .map(([groupName, group]: [Groups, ABTestGroup]) => [groupName, group.weight] as const)
  ) as Record<Groups, number>;

  if ('user' in abKeyInfo && abKeyInfo.user.abTestOverrides && abKeyInfo.user.abTestOverrides[abTest.name]) {
    return abKeyInfo.user.abTestOverrides[abTest.name];
  } else {
    // In the case where abTestKey is undefined, fall back to a random ID to preserve the group weightings
    return weightedRandomPick(groupWeights, `${abTest.name}-${abTestKey ?? randomId()}`);
  }
}

export function getAllUserABTestGroups(abKeyInfo: ABKeyInfo): CompleteTestGroupAllocation {
  let abTestGroups: CompleteTestGroupAllocation = {};
  for (const abTest of allABTests) {
    const group = getUserABTestGroup<any>(abKeyInfo, abTest);
    abTestGroups[abTest.name] = group;
  }
  return abTestGroups;
}

// Given a weighted set of strings and a seed, return a random element of that set.
export function weightedRandomPick<T extends string>(options: Record<T,number>, seed: string): T {
  const weights = Object.values<number>(options);
  if (weights.length === 0)
    throw new Error("Random pick from empty set");
  const totalWeight: number = weights.reduce((x: number, y: number) => x+y, 0);
  const randomRangeValue = totalWeight*rng(seed).double();
  
  let i=0;
  for (const key in options) {
    i += options[key];
    if (i >= randomRangeValue)
      return key;
  }
  throw new Error("Out of range value in weightedRandomPick");
}

// Returns the user's clientID. This is stored in a cookie separately from
// accounts; a user may have multiple clientIDs (eg if they have multiple
// devices) and a clientID may correspond to multiple users (if they log out and
// log in with a different account).
//
// A logged-out user's client ID determines which A/B test groups they are in.
// A logged-in user has their A/B test groups determined by the client ID they
// had when they created their account.
export function useClientId(): string | undefined {
  const [cookies] = useCookiesWithConsent([CLIENT_ID_COOKIE]);
  return cookies[CLIENT_ID_COOKIE];
}

export function classesForAbTestGroups(groups: CompleteTestGroupAllocation) {
  return Object.keys(groups)
    .map((abTestName: string) => `${abTestName}_${groups[abTestName]}`)
    .join(' ');
}
