import { makeVoteable } from '../../modules/make_voteable.js';
import { Comments } from './collection.js';
import Users from 'meteor/vulcan:users';

// Comments have the custom behavior in that they sometimes have hidden karma
const customBaseScoreReadAccess = (user, comment) => {
  // console.log('customBaseScoreReadAccess()')
  // console.log(' user', user)
  // console.log(' comment', comment)
  return Users.canDo(user, 'posts.moderate.all') || !comment.hideKarma
}

makeVoteable(Comments, {customBaseScoreReadAccess});
