import { registerComponent } from '../../../lib/vulcan-lib/components';
import React, { useCallback } from 'react';
import { canUserEditPostMetadata } from '../../../lib/collections/posts/helpers';
import { useCurrentUser } from '../../common/withUser';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";

const PostsListUpdateMutation = gql(`
  mutation updatePostMoveToDraftDropdownItem($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsList
      }
    }
  }
`);

const MoveToDraftDropdownItem = ({ post }: {
  post: PostsBase
}) => {
  const currentUser = useCurrentUser();
  const [updatePost] = useMutation(PostsListUpdateMutation);

  const handleMoveToDraftDropdownItem = useCallback(() => {
    void updatePost({
      variables: {
        selector: { _id: post._id },
        data: { draft: true }
      }
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

export default registerComponent(
  'MoveToDraftDropdownItem',
  MoveToDraftDropdownItem,
);


