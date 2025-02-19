import { makeVoteable } from '../../make_voteable';
import { Comments } from './collection';
import { userCanDo } from '../../vulcan-users/permissions';

// Comments have the custom behavior in that they sometimes have hidden karma
const customBaseScoreReadAccess = (user: DbUser|null, comment: DbComment) => {
  return !comment.hideKarma || userCanDo(user, 'posts.moderate.all')
}

makeVoteable(Comments, {
  timeDecayScoresCronjob: true,
  customBaseScoreReadAccess,
  userCanVoteOn: (user: DbUser|null, comment: DbComment, voteType: string, extendedVote: any) => {
    if (!user) {
      return {fail: true, reason: 'You must be logged in to vote.'};
    }
    if (comment.userId === user._id) {
      if (["bigUpvote", "bigDownvote"].includes(voteType)) {
        return {fail: true, reason: 'You cannot cast strong votes on your own comments'};
      }
      if (extendedVote?.agreement && extendedVote?.agreement !== "neutral") {
        return {fail: true, reason: 'You cannot cast agreement votes on your own comments'};
      }
    }
    return {fail: false};
  }
});
