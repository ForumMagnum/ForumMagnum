import { registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import React, { useCallback } from 'react';
import { canUserEditPostMetadata } from '../../lib/collections/posts/helpers';
import { useCurrentUser } from '../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';

const MoveToDraft = ({ post }: {
  post: PostsBase
}) => {
  const currentUser = useCurrentUser();
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });
  
  const handleMoveToDraft = useCallback(() => {
    void updatePost({
      selector: {_id: post._id},
      data: {draft:true}
    })
  }, [updatePost, post])

  if (!post.draft && currentUser && canUserEditPostMetadata(currentUser, post)) {
    return <div onClick={handleMoveToDraft}>
      <MenuItem>
        Move to Draft
      </MenuItem>
    </div>
  } else {
    return null
  }
}

const MoveToDraftComponent = registerComponent('MoveToDraft', MoveToDraft);

declare global {
  interface ComponentTypes {
    MoveToDraft: typeof MoveToDraftComponent
  }
}
