import * as _ from 'underscore';

export const postSuggestForAlignment = ({ currentUser, post, updatePost }: {
  currentUser: UsersCurrent,
  post: PostsBase,
  updatePost: WithUpdateFunction<"Posts">,
}) => {
  const suggestUserIds = post.suggestForAlignmentUserIds || []
  const newSuggestUserIds = _.uniq([...suggestUserIds, currentUser._id])
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
  const newSuggestUserIds = _.without([...suggestUserIds], currentUser._id)
  void updatePost({
    selector: {_id: post._id},
    data: {suggestForAlignmentUserIds:newSuggestUserIds},
  })
}
