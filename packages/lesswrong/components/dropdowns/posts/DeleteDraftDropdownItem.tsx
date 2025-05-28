import { registerComponent } from '../../../lib/vulcan-lib/components';
import React, { useCallback } from 'react';
import { postCanDelete } from '../../../lib/collections/posts/helpers';
import { useCurrentUser } from '../../common/withUser';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const PostsListUpdateMutation = gql(`
  mutation updatePostDeleteDraftDropdownItem($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsList
      }
    }
  }
`);

const DeleteDraftDropdownItem = ({ post }: {
  post: PostsBase
}) => {
  const currentUser = useCurrentUser();
  const [updatePost] = useMutation(PostsListUpdateMutation);
  const handleDelete = useCallback(() => {
    if (confirm("Are you sure you want to archive this draft?")) {
      void updatePost({
        variables: {
          selector: { _id: post._id },
          data: { deletedDraft: true, draft: true }
        }
      })
    }
  }, [post, updatePost])

  if (currentUser && postCanDelete(currentUser, post)) {
    return (
      <DropdownItem
        title={preferredHeadingCase("Archive Draft")}
        onClick={handleDelete}
      />
    );
  } else {
    return null
  }
}

export default registerComponent(
  'DeleteDraftDropdownItem',
  DeleteDraftDropdownItem,
);


