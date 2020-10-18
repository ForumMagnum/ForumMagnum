import { registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import React, { useCallback } from 'react';
import { Posts } from '../../lib/collections/posts';
import { useCurrentUser } from '../common/withUser';
import MenuItem from '@material-ui/core/MenuItem';

const DeleteDraft = ({ post }: {
  post: PostsBase
}) => {
  const currentUser = useCurrentUser();
  const {mutate: updatePost} = useUpdate({
    collection: Posts,
    fragmentName: 'PostsList',
  });
  
  const handleDelete = useCallback(() => {
    if (confirm("Are you sure you want to delete this post?")) {
      void updatePost({
        selector: {_id: post._id},
        data: {deletedDraft:true, draft: true}
      })
    }
  }, [post, updatePost])

  if (currentUser && Posts.canDelete(currentUser, post)) {
    return <div onClick={handleDelete}>
      <MenuItem>
        Delete Post
      </MenuItem>
    </div>
  } else {
    return null
  }
}

const DeleteDraftComponent = registerComponent('DeleteDraft', DeleteDraft);

declare global {
  interface ComponentTypes {
    DeleteDraft: typeof DeleteDraftComponent
  }
}
