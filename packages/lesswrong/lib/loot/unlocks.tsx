import React, { createContext, useContext, useMemo } from 'react';
import { gql, useQuery } from "@apollo/client"
import { Components } from "../vulcan-lib/components"

export const REGULAR_BOX_COST = 100;
export const PREMIUM_BOX_COST = 500;

export class Unlockable {
  name: string
  description: string
  repeatable: boolean
  rarity: "common"|"uncommon"|"rare"

  constructor({name, description, repeatable, rarity}: {
    name: string
    description: string
    repeatable?: boolean
    rarity: "common"|"uncommon"|"rare"
  }) {
    this.name = name;
    this.description = description;
    this.repeatable = !!repeatable;
    this.rarity = rarity;
  }
}

export const allUnlockables = [
  new Unlockable({
    name: "notBeenAGoodUserAlbum",
    description: "Fooming Shoggoths Album",
    repeatable: false,
    rarity: "common",
  }),
  new Unlockable({
    name: "ghiblify",
    description: "Ghibli Theme",
    repeatable: false,
    rarity: "common",
  }),
  new Unlockable({
    name: "strongUpvoteStrength",
    description: "Strong Upvote Strength",
    repeatable: true,
    rarity: "common",
  }),
];

declare global {
  type UserUnlockablesState = {
    unlocks: Record<string,number>
    spinsPerformed: number
    spinsRemaining: number
    premiumSpinsPerformed: number
    premiumSpinsRemaining: number
    cooldownEndsAt: number
    lwBucks: number
    picoLightcones: number
  };
}

export const defaultUserUnlockablesState: UserUnlockablesState = {
  unlocks: {},
  spinsPerformed: 0,
  spinsRemaining: 1,
  premiumSpinsPerformed: 0,
  premiumSpinsRemaining: 0,
  cooldownEndsAt: 0,
  lwBucks: 0,
  picoLightcones: 0,
};

type UnlocksContextType = {
  unlocksState: UserUnlockablesState
  refetch: () => Promise<any>
}

const UnlocksContext = createContext<UnlocksContextType|null>(null);

export function UnlocksContextProvider({children}: {
  children: React.ReactNode
}) {
  const { data, loading, refetch } = useQuery(gql`query myUnlocks {
    CurrentUserUnlockableState
  }`);
  
  const unlocksState = data?.CurrentUserUnlockableState ?? defaultUserUnlockablesState;
  const unlocksContext: UnlocksContextType = useMemo(() => ({
    unlocksState, refetch
  }), [unlocksState, refetch]);
  
  if (loading && !data) {
    return <Components.Loading/>
  }

  return <UnlocksContext.Provider value={unlocksContext}>
    {children}
  </UnlocksContext.Provider>
}

export const useCurrentUserUnlocks = (): UnlocksContextType => {
  return useContext(UnlocksContext)!;
}

export function getUnlockByName(name: string): Unlockable|null {
  return allUnlockables.find(u=>u.name === name) ?? null;
}

export const getUnlockCount = (state: UserUnlockablesState, unlockName: string): number => {
  const unlock = getUnlockByName(unlockName);
  if (!unlock) return 0;
  return state?.unlocks?.[unlock.name] ?? 0;
}


export const hasUnlock = (state: UserUnlockablesState, unlockName: string): boolean => {
  return getUnlockCount(state, unlockName) > 0;
}
