import isEqual from 'lodash/isEqual';
import type { CollectionVoteOptions } from '../../make_voteable';
import { userCanDo } from '../../vulcan-users/permissions';

// Comments have the custom behavior in that they sometimes have hidden karma
export const customBaseScoreReadAccess = (user: DbUser|null, comment: DbComment) => {
  return !comment.hideKarma || userCanDo(user, 'posts.moderate.all')
}

interface ReactVote {
  react: string,
  vote: string,
  quotes?: string[],
}

const isReactVoteArray = (value: unknown): value is ReactVote[] => {
  return Array.isArray(value) && value.every(element => typeof element?.react === "string" && typeof element?.vote === "string");
}

const isBlankVoteValue = (value: unknown) => !value || value === "neutral";

const reactVoteIsRetained = (reactVote: ReactVote, existingReactVotes: ReactVote[]) => {
  return existingReactVotes.some(existingReactVote =>
    existingReactVote.react === reactVote.react
    && existingReactVote.vote === reactVote.vote
    && (reactVote.quotes ?? []).every(quote => (existingReactVote.quotes ?? []).includes(quote))
  );
}

const extendedVoteFieldOnlyRemoves = (newValue: unknown, existingValue: unknown) => {
  if (isBlankVoteValue(newValue)) return true;
  if (isReactVoteArray(newValue)) {
    const existingReactVotes = isReactVoteArray(existingValue) ? existingValue : [];
    return newValue.every(reactVote => reactVoteIsRetained(reactVote, existingReactVotes));
  }
  return isEqual(newValue, existingValue);
}

const voteOnlyRemovesExistingVotes = (existingVote: DbVote|null, voteType: string|null, extendedVote: Record<string, unknown>|null) => {
  const karmaVoteOk = isBlankVoteValue(voteType) || voteType === existingVote?.voteType;
  const existingExtendedVote = existingVote?.extendedVoteType ?? {};
  const extendedVoteOk = Object.entries(extendedVote ?? {}).every(
    ([key, value]) => extendedVoteFieldOnlyRemoves(value, existingExtendedVote[key])
  );
  return karmaVoteOk && extendedVoteOk;
}

export const commentVotingOptions: CollectionVoteOptions = {
  timeDecayScoresCronjob: true,
  userCanVoteOn: async (user: DbUser|null, comment: DbComment, voteType: string|null, extendedVote: any, context: ResolverContext) => {
    if (!user) {
      return {fail: true, reason: 'You must be logged in to vote.'};
    }
    if (comment.userId === user._id) {
      if (["bigUpvote", "bigDownvote"].includes(voteType ?? "")) {
        return {fail: true, reason: 'You cannot cast strong votes on your own comments'};
      }
      if (extendedVote?.agreement && extendedVote?.agreement !== "neutral") {
        return {fail: true, reason: 'You cannot cast agreement votes on your own comments'};
      }
    }
    if (comment.deleted) {
      const existingVote = await context.Votes.findOne({ documentId: comment._id, userId: user._id, cancelled: false });
      if (!voteOnlyRemovesExistingVotes(existingVote, voteType, extendedVote)) {
        return {fail: true, reason: 'You cannot vote on deleted comments'};
      }
    }
    return {fail: false};
  }
};
