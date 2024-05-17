import uniq from 'lodash/uniq';
import without from 'lodash/without';

export const postSuggestForAlignment = ({ currentUser, post, updatePost }: {
  currentUser: UsersCurrent,
  post: PostsBase,
  updatePost: WithUpdateFunction<"Posts">,
}) => {
  const suggestUserIds = post.suggestForAlignmentUserIds || []
  const newSuggestUserIds = uniq([...suggestUserIds, currentUser._id])
  void updatePost({
    selector: {_id: post._id},
    data: {suggestForAlignmentUserIds: newSuggestUserIds},
  })
}

export const postUnSuggestForAlignment = ({ currentUser, post, updatePost }: {
  currentUser: UsersCurrent,
  post: PostsBase,
  updatePost: WithUpdateFunction<"Posts">,
}) => {
  const suggestUserIds = post.suggestForAlignmentUserIds || []
  const newSuggestUserIds = without([...suggestUserIds], currentUser._id)
  void updatePost({
    selector: {_id: post._id},
    data: {suggestForAlignmentUserIds:newSuggestUserIds},
  })
}
