import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { postSuggestForAlignment, postUnSuggestForAlignment } from '../../../lib/alignment-forum/posts/helpers';
import { userCanSuggestPostForAlignment } from '../../../lib/alignment-forum/users/helpers';
import { useCurrentUser } from '../../common/withUser';
import { isLWorAF } from '../../../lib/instanceSettings';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/crud/wrapGql";

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
        onClick={() => postUnSuggestForAlignment({currentUser, post, updatePost})}
      />
    );
  }

  return (
    <DropdownItem
      title="Ω Suggest for Alignment"
      onClick={() => postSuggestForAlignment({currentUser, post, updatePost})}
    />
  );
}

export default registerComponent(
  'SuggestAlignmentPostDropdownItem',
  SuggestAlignmentPostDropdownItem,
);


