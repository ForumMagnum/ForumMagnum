import { isEAForum } from "../instanceSettings";
import { namesAttachedReactionsVotingSystem } from "./namesAttachedReactions";
import { reactionsAndLikesVotingSystem } from "./reactionsAndLikes";
import { defaultVotingSystem, eaEmojisVotingSystem, emojiReactionsVotingSystem, reactsBallotVotingSystem, twoAxisVotingSystem, type VotingSystem } from "./votingSystems";

const votingSystems: Partial<Record<string,VotingSystem>> = {
  default: defaultVotingSystem,
  twoAxis: twoAxisVotingSystem,
  namesAttachedReactions: namesAttachedReactionsVotingSystem,
  reactionsAndLikes: reactionsAndLikesVotingSystem,
  reactsBallot: reactsBallotVotingSystem,
  emojiReactions: emojiReactionsVotingSystem,
  eaEmojis: eaEmojisVotingSystem,
};

export function getVotingSystemByName(name: string): VotingSystem {
  if (name && votingSystems[name])
    return votingSystems[name]!;
  else
    return getDefaultVotingSystem();
}

export function getDefaultVotingSystem(): VotingSystem {
  return votingSystems["default"]!;
}

export function getVotingSystems(): VotingSystem[] {
  return Object.keys(votingSystems).map(k => votingSystems[k]!);
}

export async function getVotingSystemNameForDocument(document: VoteableType, collectionName: VoteableCollectionName, context: ResolverContext): Promise<string> {
  if (collectionName === "MultiDocuments" || collectionName === "Tags") {
    return "reactionsAndLikes";
  }
  if ((document as DbComment).tagId) {
    return isEAForum ? "eaEmojis" : "namesAttachedReactions";
  }
  if ((document as DbComment).postId) {
    const post = await context.loaders.Posts.load((document as DbComment).postId!);
    if (post?.votingSystem) {
      return post.votingSystem;
    }
  }
  return (document as DbPost)?.votingSystem ?? "default";
}

export async function getVotingSystemForDocument(document: VoteableType, collectionName: VoteableCollectionName, context: ResolverContext) {
  return getVotingSystemByName(await getVotingSystemNameForDocument(document, collectionName, context));
}
