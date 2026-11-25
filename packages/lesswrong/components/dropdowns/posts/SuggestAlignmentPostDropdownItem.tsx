import React from 'react';
import { userCanSuggestPostForAlignment } from '../../../lib/alignment-forum/users/helpers';
import { useCurrentUser } from '../../common/withUser';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client/react";
import { SetPostSuggestedForAlignmentMutation } from '../../alignment-forum/alignmentSuggestionMutations';

const SuggestAlignmentPostDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const [setPostSuggestedForAlignment] = useMutation(SetPostSuggestedForAlignmentMutation);

  if (
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
          void setPostSuggestedForAlignment({
            variables: { postId: post._id, suggested: false }
          })
        )}
      />
    );
  }

  return (
    <DropdownItem
      title="Ω Suggest for Alignment"
      onClick={() => (
        void setPostSuggestedForAlignment({
          variables: { postId: post._id, suggested: true }
        })
      )}
    />
  );
}

export default SuggestAlignmentPostDropdownItem;

