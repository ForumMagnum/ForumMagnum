import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { userCanSuggestPostForAlignment } from '../../../lib/alignment-forum/users/helpers';
import { useCurrentUser } from '../../common/withUser';
import { isLWorAF } from '../../../lib/instanceSettings';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen/gql";
import uniq from 'lodash/uniq';
import without from 'lodash/without';

const PostsListUpdateMutation = gql(`
  mutation updatePostSuggestAlignmentPostDropdownItem($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsList
      }
    }
  }
`);

const SuggestAlignmentPostDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const [updatePost] = useMutation(PostsListUpdateMutation);

  if (
    !isLWorAF ||
    !currentUser ||
    !userCanSuggestPostForAlignment({currentUser, post})
  ) {
    return null;
  }

  const userHasSuggested = post.suggestForAlignmentUserIds &&
    post.suggestForAlignmentUserIds.includes(currentUser!._id);
  if (userHasSuggested) {
    return (
      <DropdownItem
        title="Ω Unsuggest for Alignment"
        onClick={() => (
          void updatePost({
            variables: {
              selector: { _id: post._id },
              data: { suggestForAlignmentUserIds: without(post.suggestForAlignmentUserIds, currentUser._id) }
            }
          })
        )}
      />
    );
  }

  return (
    <DropdownItem
      title="Ω Suggest for Alignment"
      onClick={() => (
        void updatePost({
          variables: {
            selector: { _id: post._id },
            data: { suggestForAlignmentUserIds: uniq([...post.suggestForAlignmentUserIds, currentUser._id]) }
          }
        })
      )}
    />
  );
}

export default registerComponent(
  'SuggestAlignmentPostDropdownItem',
  SuggestAlignmentPostDropdownItem,
);


