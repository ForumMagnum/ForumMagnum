import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useUpdate } from '../../../lib/crud/withUpdate';
import React, { useCallback } from 'react';
import { canUserEditPostMetadata } from '../../../lib/collections/posts/helpers';
import { useCurrentUser } from '../../common/withUser';
import { preferredHeadingCase } from '../../../themes/forumTheme';


const MoveToDraftDropdownItemInner = ({ post }: {
  post: PostsBase
}) => {
  const currentUser = useCurrentUser();
  const {DropdownItem} = Components;
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });

  const handleMoveToDraftDropdownItem = useCallback(() => {
    void updatePost({
      selector: {_id: post._id},
      data: {draft:true}
    })
  }, [updatePost, post])

  if (!post.draft && currentUser && canUserEditPostMetadata(currentUser, post)) {
    return (
      <DropdownItem
        title={preferredHeadingCase("Move to Draft")}
        onClick={handleMoveToDraftDropdownItem}
      />
    );
  } else {
    return null
  }
}

export const MoveToDraftDropdownItem = registerComponent(
  'MoveToDraftDropdownItem',
  MoveToDraftDropdownItemInner,
);

declare global {
  interface ComponentTypes {
    MoveToDraftDropdownItem: typeof MoveToDraftDropdownItem
  }
}
