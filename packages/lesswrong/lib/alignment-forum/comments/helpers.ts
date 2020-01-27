import { Comments } from '../../collections/comments';
import * as _ from 'underscore';

Comments.suggestForAlignment = async ({ currentUser, comment, updateComment }) => {
  const suggestUserIds = comment.suggestForAlignmentUserIds || []
  const newSuggestUserIds = _.uniq([...suggestUserIds, currentUser._id])
  updateComment({
    selector: { _id: comment._id},
    data: {suggestForAlignmentUserIds: newSuggestUserIds},
  })
}

Comments.unSuggestForAlignment = async ({ currentUser, comment, updateComment }) => {
  const suggestUserIds = comment.suggestForAlignmentUserIds || []
  const newSuggestUserIds = _.without([...suggestUserIds], currentUser._id)
  await updateComment({
    selector: { _id: comment._id},
    data: {suggestForAlignmentUserIds: newSuggestUserIds},
  })
}
