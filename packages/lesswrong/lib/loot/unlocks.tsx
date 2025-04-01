import React, { createContext, useContext, useMemo } from 'react';
import { gql, useQuery } from "@apollo/client"
import { Components } from "../vulcan-lib/components"
import { Link } from '@/lib/reactRouterWrapper';

export const REGULAR_BOX_COST = 100;
export const PREMIUM_BOX_COST = 500;

export const REGULAR_BOX_PICO_COST = 1;
export const PREMIUM_BOX_PICO_COST = 3;

export class Unlockable {
  name: string
  description: string
  repeatable: boolean
  rarity: "common"|"uncommon"|"rare"
  publiclyDisplayed: boolean

  constructor({name, description, repeatable, rarity, publiclyDisplayed}: {
    name: string
    description: string
    repeatable?: boolean
    rarity: "common"|"uncommon"|"rare"
    publiclyDisplayed?: boolean
  }) {
    this.name = name;
    this.description = description;
    this.repeatable = !!repeatable;
    this.rarity = rarity;
    this.publiclyDisplayed = !!publiclyDisplayed
  }
}

export type VirtueOfRationality = {
  name: string
  shortDescription: string
  longDescription: React.ReactNode
  imagePath?: string
};

export const twelveVirtues: VirtueOfRationality[] = [
  {
    name: "curiosity",
    shortDescription: "The Virtue of Curiosity",
    longDescription: <p>The first virtue is curiosity. Wouldn't you like to know what exciting rewards are inside of our lootboxes?</p>,
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/a_180/a_hflip/v1743478219/loot/Curiosity.png",
  },
  {
    name: "relinquishment",
    shortDescription: "The Virtue of Relinquishment",
    longDescription: <p>The second virtue is relinquishment. Traditionally this refers to relinquishing ignorance - relinquish the emotion which rests upon mistaken belief, etc etc. But <Link to="/donate">relinquishing your money</Link> is even better!</p>,
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/a_180/a_hflip/v1743478227/loot/Relinquishment.png",
  },
  {
    name: "lightness",
    shortDescription: "The Virtue of Lightness",
    longDescription: <p>The third virtue is Lightness. Let the winds of evidence blow you about as though you are a leaf, with no direction of your own. Beware lest you fight a rearguard retreat against the evidence, grudgingly conceding each foot of ground only when forced, feeling cheated.</p>,
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/a_180/a_hflip/v1743478224/loot/Lightness.png",
  },
  {
    name: "evenness",
    shortDescription: "The Virtue of Evenness",
    longDescription: <p>One who wishes to believe says, “Does the evidence permit me to believe?” One who wishes to disbelieve asks, “Does the evidence force me to believe?” Beware lest you place huge burdens of proof only on propositions you dislike, and then defend yourself by saying: “But it is good to be skeptical.”</p>,
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/a_180/a_hflip/v1743478223/loot/Evenness.png",
  },
  {
    name: "argument",
    shortDescription: "The Virtue of Argument",
    longDescription: <p>Those who wish to fail must first prevent their friends from helping them. Those who smile wisely and say “I will not argue” remove themselves from help and withdraw from the communal effort. In argument strive for exact honesty, for the sake of others and also yourself: the part of yourself that distorts what you say to others also distorts your own thoughts.</p>,
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/a_180/a_hflip/v1743478224/loot/Argument.png",
  },
  {
    name: "empiricism",
    shortDescription: "The Virtue of Empiricism",
    longDescription: <p>Figuring out the optimal strategy for getting LessWrong Lootboxes requires experimentation. Lots of experimentation. You need a big sample size. An <i>expensive</i> sample size.</p>,
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/a_180/a_hflip/v1743478226/loot/Empiricism.png"
  },
  {
    name: "simplicity",
    shortDescription: "The Virtue of Simplicity",
    longDescription: <p>Antoine de Saint-Exupéry said: “Perfection is achieved not when there is nothing left to add, but when there is nothing left to take away.” Simplicity is virtuous in belief, design, planning, and justification. When you profess a huge belief with many details, each additional detail is another chance for the belief to be wrong.</p>,
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/a_180/a_hflip/v1743478225/loot/Simplicity.png",
  },
  {
    name: "humility",
    shortDescription: "The Virtue of Humility",
    longDescription: <p> To be humble is to take specific actions in anticipation of your own errors. To confess your fallibility and then do nothing about it is not humble; it is boasting of your modesty. Who are most humble? Those who most skillfully prepare for the deepest and most catastrophic errors in their own beliefs and plans.</p>,
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/a_180/a_hflip/v1743478220/loot/Humility.png",
  },
  {
    name: "perfectionism",
    shortDescription: "The Virtue of Perfectionism",
    longDescription: <p>The ninth virtue is perfectionism. So long as there is a loot-box reward still locked, your collection is not perfect.</p>,
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/a_180/a_hflip/v1743478221/loot/Perfectionism.png",
  },
  {
    name: "precision",
    shortDescription: "The Virtue of Precision",
    longDescription: <p>One comes and says: The quantity is between 1 and 100. Another says: The quantity is between 40 and 50. If the quantity is 42 they are both correct, but the second prediction was more useful and exposed itself to a stricter test. What is true of one apple may not be true of another apple; thus more can be said about a single apple than about all the apples in the world.</p>,
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/a_180/a_hflip/v1743478218/loot/Precision.png",
  },
  {
    name: "scholarship",
    shortDescription: "The Virtue of Scholarship",
    longDescription: <p>Study many sciences and absorb their power as your own. Each field that you consume makes you larger. If you swallow enough sciences the gaps between them will diminish and your knowledge will become a unified whole. And you can get stickers for each of them, to display on your profile!</p>,
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/a_180/a_hflip/v1743478222/loot/Scholarship.png"
  },
  {
    name: "void",
    shortDescription: "The Void",
    longDescription: <p>Every step of your reasoning must cut through to the correct answer in the same movement. More than anything, you must think of carrying your map through to reflecting the territory. If you fail to achieve a correct answer, it is futile to protest that you acted with propriety.</p>,
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/a_180/a_hflip/v1743478219/loot/Void.png",
  },
];

interface CurrencyReward {
  name: string
  description: string
  rarity: "common"|"uncommon"|"rare"
  imagePath?: string
}

export const currencyRewards: CurrencyReward[] = [
  {
    name: "lwBucksSmall",
    description: "A small amount of LW Bucks",
    rarity: "common",
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/v1743478588/loot/LWBuxIcon.png",
  },
  {
    name: "lwBucksMedium",
    description: "A medium amount of LW Bucks",
    rarity: "uncommon",
    // TODO: real url
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/v1743478588/loot/LWBuxIcon.png",
  },
  {
    name: "lwBucksLarge",
    description: "A large amount of LW Bucks",
    rarity: "rare",
    // TODO: real url
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/v1743478588/loot/LWBuxIcon.png",
  },
  {
    name: "picoLightconesSmall",
    description: "A small amount of Pico Lightcones",
    rarity: "common",
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/v1743477104/loot/PicoLightcone.png",
  },
  {
    name: "picoLightconesMedium",
    description: "A medium amount of Pico Lightcones",
    rarity: "uncommon",
    // TODO: real url
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/v1743477104/loot/PicoLightcone.png",
  },
  {
    name: "picoLightconesLarge",
    description: "A large amount of Pico Lightcones",
    rarity: "rare",
    // TODO: real url
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/v1743477104/loot/PicoLightcone.png",
  },
];

interface ThemeReward {
  name: string
  description: string
  rarity: "common"|"uncommon"|"rare"
  imagePath?: string
}

export const themeRewards: ThemeReward[] = [
  {
    name: "ghiblify",
    description: "Ghibli Theme",
    rarity: "common",
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/v1743374575/loot/ghibli_theme.png"
  },
];

interface VoteReward {
  name: string
  description: string
  rarity: "common"|"uncommon",
  imagePath?: string
}

export const voteRewards: VoteReward[] = [
  {
    name: "smallUpvoteStrength",
    description: "Small Upvote Strength",
    rarity: "common",
    // TODO: real url
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/v1743374403/loot/strong_upvote.png",
  },
  {
    name: "largeUpvoteStrength",
    description: "Large Upvote Strength",
    rarity: "uncommon",
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/v1743374403/loot/strong_upvote.png",
  },
  {
    name: "smallDownvoteStrength",
    description: "Small Downvote Strength",
    rarity: "common",
    // TODO: real url
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/v1743374403/loot/strong_upvote.png",
  },
  {
    name: "largeDownvoteStrength",
    description: "Large Downvote Strength",
    rarity: "uncommon",
    // TODO: real url
    imagePath: "https://res.cloudinary.com/lesswrong-2-0/image/upload/c_scale,w_64,h_64/v1743374403/loot/strong_upvote.png",
  }
];

export const twelveVirtuesUnlocks = twelveVirtues.map(v => new Unlockable({
  name: v.name,
  description: v.shortDescription,
  repeatable: true,
  rarity: "common",
  publiclyDisplayed: true,
}));

export const currencyRewardsUnlocks = currencyRewards.map(c => new Unlockable({
  name: c.name,
  description: c.description,
  repeatable: true,
  rarity: c.rarity,
  publiclyDisplayed: false,
}));

export const themeRewardsUnlocks = themeRewards.map(t => new Unlockable({
  name: t.name,
  description: t.description,
  repeatable: false,
  rarity: t.rarity,
  publiclyDisplayed: false,
}));

export const voteRewardsUnlocks = voteRewards.map(v => new Unlockable({
  name: v.name,
  description: v.description,
  repeatable: true,
  rarity: v.rarity,
  publiclyDisplayed: false,
}));

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
  ...twelveVirtuesUnlocks,
  ...currencyRewardsUnlocks,
  ...themeRewardsUnlocks,
  ...voteRewardsUnlocks,
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
