import { Posts } from '../../../collections/posts';

Posts.suggestForAlignment = ({ currentUser, post, editMutation }) => {
  const suggestUserIds = post.suggestForAlignmentUserIds || []
  const newSuggestUserIds = _.uniq([...suggestUserIds, currentUser._id])
  editMutation({
    documentId: post._id,
    set: {suggestForAlignmentUserIds: newSuggestUserIds},
    unset: {},
    validate: false,
  })
}

Posts.unSuggestForAlignment = ({ currentUser, post, editMutation }) => {
  const suggestUserIds = post.suggestForAlignmentUserIds || []
  const newSuggestUserIds = _.without([...suggestUserIds], currentUser._id)
  editMutation({
    documentId: post._id,
    set: {suggestForAlignmentUserIds:newSuggestUserIds},
    unset: {},
    validate: false,
  })
}
