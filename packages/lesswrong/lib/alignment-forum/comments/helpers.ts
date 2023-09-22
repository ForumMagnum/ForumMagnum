import * as _ from 'underscore';
import type { UpdateCommentCallback } from "../../../components/hooks/useUpdateComment";

export const commentSuggestForAlignment = async ({ currentUser, comment, updateComment }: {
  currentUser: UsersCurrent,
  comment: CommentsList,
  updateComment: UpdateCommentCallback,
}) => {
  const suggestUserIds = comment.suggestForAlignmentUserIds || []
  const newSuggestUserIds = _.uniq([...suggestUserIds, currentUser._id])
  void updateComment(comment._id, {
    suggestForAlignmentUserIds: newSuggestUserIds
  })
}

export const commentUnSuggestForAlignment = async ({ currentUser, comment, updateComment }: {
  currentUser: UsersCurrent,
  comment: CommentsList,
  updateComment: UpdateCommentCallback,
}) => {
  const suggestUserIds = comment.suggestForAlignmentUserIds || []
  const newSuggestUserIds = _.without([...suggestUserIds], currentUser._id)
  await updateComment(comment._id, {
    suggestForAlignmentUserIds: newSuggestUserIds,
  })
}
