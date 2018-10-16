import { Comments } from '../../../collections/comments';

Comments.suggestForAlignment = ({ currentUser, comment, updateComment }) => {
  const suggestUserIds = comment.suggestForAlignmentUserIds || []
  const newSuggestUserIds = _.uniq([...suggestUserIds, currentUser._id])
  updateComment({
    selector: { _id: comment._id},
    data: {suggestForAlignmentUserIds: newSuggestUserIds},
  })
}

Comments.unSuggestForAlignment = ({ currentUser, comment, updateComment }) => {
  const suggestUserIds = comment.suggestForAlignmentUserIds || []
  const newSuggestUserIds = _.without([...suggestUserIds], currentUser._id)
  updateComment({
    selector: { _id: comment._id},
    data: {suggestForAlignmentUserIds: newSuggestUserIds},
  })
}
