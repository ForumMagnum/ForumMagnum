import * as _ from 'underscore';

export const commentSuggestForAlignment = async ({ currentUser, comment, updateComment }: {
  currentUser: UsersCurrent,
  comment: CommentsList,
  updateComment: WithUpdateFunction<"Comments">,
}) => {
  const suggestUserIds = comment.suggestForAlignmentUserIds || []
  const newSuggestUserIds = _.uniq([...suggestUserIds, currentUser._id])
  void updateComment({
    selector: { _id: comment._id},
    data: {suggestForAlignmentUserIds: newSuggestUserIds},
  })
}

export const commentUnSuggestForAlignment = async ({ currentUser, comment, updateComment }: {
  currentUser: UsersCurrent,
  comment: CommentsList,
  updateComment: WithUpdateFunction<"Comments">,
}) => {
  const suggestUserIds = comment.suggestForAlignmentUserIds || []
  const newSuggestUserIds = _.without([...suggestUserIds], currentUser._id)
  await updateComment({
    selector: { _id: comment._id},
    data: {suggestForAlignmentUserIds: newSuggestUserIds},
  })
}
