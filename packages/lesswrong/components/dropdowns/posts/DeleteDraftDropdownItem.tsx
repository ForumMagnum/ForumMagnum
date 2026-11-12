import React, { useCallback } from 'react';
import { userOwns } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

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

  if (post.draft && userOwns(currentUser, post)) {
    return (
      <DropdownItem
        title={"Archive Draft"}
        onClick={handleDelete}
      />
    );
  } else {
    return null
  }
}

export default DeleteDraftDropdownItem;


