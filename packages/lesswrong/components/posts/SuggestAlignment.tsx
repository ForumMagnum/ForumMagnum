import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import React from 'react';
import { postSuggestForAlignment, postUnSuggestForAlignment } from '../../lib/alignment-forum/posts/helpers';
import { userCanSuggestPostForAlignment } from '../../lib/alignment-forum/users/helpers';
import { useCurrentUser } from '../common/withUser';

const SuggestAlignment = ({ post }: {
  post: PostsBase
}) => {
  const currentUser = useCurrentUser();
  const { MenuItem } = Components;
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });
  
  const userHasSuggested = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser!._id)

  if (currentUser && userCanSuggestPostForAlignment({currentUser, post})) {
    return <div>
      { userHasSuggested ?
        <div  onClick={() => postUnSuggestForAlignment({currentUser, post, updatePost})}>
          <MenuItem>
            Ω Unsuggest for Alignment
          </MenuItem>
        </div>
        :
        <div  onClick={() => postSuggestForAlignment({currentUser, post, updatePost})}>
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
