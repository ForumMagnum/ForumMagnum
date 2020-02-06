import { Posts } from '../../collections/posts';
import * as _ from 'underscore';

Posts.suggestForAlignment = ({ currentUser, post, updatePost }) => {
  const suggestUserIds = post.suggestForAlignmentUserIds || []
  const newSuggestUserIds = _.uniq([...suggestUserIds, currentUser._id])
  updatePost({
    selector: {_id: post._id},
    data: {suggestForAlignmentUserIds: newSuggestUserIds},
  })
}

Posts.unSuggestForAlignment = ({ currentUser, post, updatePost }) => {
  const suggestUserIds = post.suggestForAlignmentUserIds || []
  const newSuggestUserIds = _.without([...suggestUserIds], currentUser._id)
  updatePost({
    selector: {_id: post._id},
    data: {suggestForAlignmentUserIds:newSuggestUserIds},
  })
}
