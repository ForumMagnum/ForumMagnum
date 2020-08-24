import { registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import React from 'react';
import { Posts } from '../../lib/collections/posts';
import Users from '../../lib/collections/users/collection';
import { useCurrentUser } from '../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';

const SuggestAlignment = ({ post }: {
  post: PostsBase
}) => {
  const currentUser = useCurrentUser();
  const {mutate: updatePost} = useUpdate({
    collection: Posts,
    fragmentName: 'PostsList',
  });
  
  const userHasSuggested = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser!._id)

  if (currentUser && Users.canSuggestPostForAlignment({currentUser, post})) {
    return <div>
      { userHasSuggested ?
        <div  onClick={() => Posts.unSuggestForAlignment({currentUser, post, updatePost})}>
          <MenuItem>
            Ω Unsuggest for Alignment
          </MenuItem>
        </div>
        :
        <div  onClick={() => Posts.suggestForAlignment({currentUser, post, updatePost})}>
          <MenuItem>
            Ω Suggest for Alignment
          </MenuItem>
        </div>
      }
    </div>
  } else {
    return null
  }
}

const SuggestAlignmentComponent = registerComponent(
  'SuggestAlignment', SuggestAlignment
);

declare global {
  interface ComponentTypes {
    SuggestAlignment: typeof SuggestAlignmentComponent
  }
}
