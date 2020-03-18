import { makeVoteable } from '../../make_voteable';
import { Comments } from './collection';
import Users from '../users/collection';

// Comments have the custom behavior in that they sometimes have hidden karma
const customBaseScoreReadAccess = (user, comment) => {
  return Users.canDo(user, 'posts.moderate.all') || !comment.hideKarma
}

makeVoteable(Comments, {customBaseScoreReadAccess});
