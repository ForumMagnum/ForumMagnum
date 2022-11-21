import { makeVoteable } from '../../make_voteable';
import { Comments } from './collection';
import { userCanDo } from '../../vulcan-users/permissions';

// Comments have the custom behavior in that they sometimes have hidden karma
const customBaseScoreReadAccess = (user: DbUser|null, comment: DbComment) => {
  return userCanDo(user, 'posts.moderate.all') || !comment.hideKarma
}

makeVoteable(Comments, {
  timeDecayScoresCronjob: true,
  customBaseScoreReadAccess,
  userCanVoteOn: (user: DbUser|null, comment: DbComment, voteType: string) => {
    if (!user) return false;
    if (comment.userId === user._id && ["bigUpvote", "bigDownvote"].includes(voteType)) return false;
    return true;
  }
});
