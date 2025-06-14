'use client';

import { getVotingSystemNameForDocument } from "../collections/comments/helpers";
import { namesAttachedReactionsVotingSystem } from "./namesAttachedReactions";
import { reactionsAndLikesVotingSystem } from "./reactionsAndLikes";
import { defaultVotingSystem, eaEmojisVotingSystem, emojiReactionsVotingSystem, reactsBallotVotingSystem, twoAxisVotingSystem, type VotingSystem } from "./votingSystems";

// const votingSystems: Partial<Record<string,VotingSystem>> = {
//   default: defaultVotingSystem,
//   twoAxis: twoAxisVotingSystem,
//   namesAttachedReactions: namesAttachedReactionsVotingSystem,
//   reactionsAndLikes: reactionsAndLikesVotingSystem,
//   reactsBallot: reactsBallotVotingSystem,
//   emojiReactions: emojiReactionsVotingSystem,
//   eaEmojis: eaEmojisVotingSystem,
// };

export function getVotingSystemByName(name: string): VotingSystem {
  const votingSystems = getAllVotingSystems();
  if (name && votingSystems[name])
    return votingSystems[name]!;
  else
    return getDefaultVotingSystem();
}

export function getDefaultVotingSystem(): VotingSystem {
  const votingSystems = getAllVotingSystems();
  return votingSystems["default"]!;
}

const getAllVotingSystems = (() => {
  let votingSystems: Partial<Record<string,VotingSystem>>;

  return () => {
    if (!votingSystems) {
      votingSystems = {
        default: defaultVotingSystem,
        twoAxis: twoAxisVotingSystem,
        namesAttachedReactions: namesAttachedReactionsVotingSystem,
        reactionsAndLikes: reactionsAndLikesVotingSystem,
        reactsBallot: reactsBallotVotingSystem,
        emojiReactions: emojiReactionsVotingSystem,
        eaEmojis: eaEmojisVotingSystem,
      }
    }
    return votingSystems;
  };
})();

export function getVotingSystems(): VotingSystem[] {
  const votingSystems = getAllVotingSystems();
  return Object.keys(votingSystems).map(k => votingSystems[k]!);
}

export async function getVotingSystemForDocument(document: VoteableType, collectionName: VoteableCollectionName, context: ResolverContext) {
  return getVotingSystemByName(await getVotingSystemNameForDocument(document, collectionName, context));
}
