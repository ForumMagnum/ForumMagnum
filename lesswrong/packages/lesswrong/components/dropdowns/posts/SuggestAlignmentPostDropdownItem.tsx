import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { postSuggestForAlignment, postUnSuggestForAlignment } from '../../../lib/alignment-forum/posts/helpers';
import { userCanSuggestPostForAlignment } from '../../../lib/alignment-forum/users/helpers';
import { useCurrentUser } from '../../common/withUser';
import { isLWorAF } from '../../../lib/instanceSettings';

const SuggestAlignmentPostDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });

  if (
    !isLWorAF ||
    !currentUser ||
    !userCanSuggestPostForAlignment({currentUser, post})
  ) {
    return null;
  }

  const userHasSuggested = post.suggestForAlignmentUserIds &&
    post.suggestForAlignmentUserIds.includes(currentUser!._id);

  const { DropdownItem } = Components;

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

const SuggestAlignmentPostDropdownItemComponent = registerComponent(
  'SuggestAlignmentPostDropdownItem',
  SuggestAlignmentPostDropdownItem,
);

declare global {
  interface ComponentTypes {
    SuggestAlignmentPostDropdownItem: typeof SuggestAlignmentPostDropdownItemComponent
  }
}
