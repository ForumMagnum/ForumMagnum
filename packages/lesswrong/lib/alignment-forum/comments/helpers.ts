import uniq from "lodash/uniq"
import without from "lodash/without"

export const commentSuggestForAlignment = async ({ currentUser, comment, updateComment }: {
  currentUser: UsersCurrent,
  comment: CommentsList,
  updateComment: WithUpdateFunction<"Comments">,
}) => {
  const suggestUserIds = comment.suggestForAlignmentUserIds || []
  const newSuggestUserIds = uniq([...suggestUserIds, currentUser._id])
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
  const newSuggestUserIds = without([...suggestUserIds], currentUser._id)
  await updateComment({
    selector: { _id: comment._id},
    data: {suggestForAlignmentUserIds: newSuggestUserIds},
  })
}
