import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useUpdate } from '../../../lib/crud/withUpdate';
import React from 'react';
import { userCanDo, userIsMemberOf } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { clone, without } from 'underscore';
import { isAF } from '../../../lib/instanceSettings';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import DropdownItem from "@/components/dropdowns/DropdownItem";

const SuggestCuratedDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });
  
  if (!currentUser)
    return null;
  
  const handleSuggestCurated = () => {
    let suggestUserIds = clone(post.suggestForCuratedUserIds) || []
    if (!suggestUserIds.includes(currentUser._id)) {
      suggestUserIds.push(currentUser._id)
    }
    void updatePost({
      selector: { _id: post._id },
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  const handleUnsuggestCurated = () => {
    let suggestUserIds = clone(post.suggestForCuratedUserIds) || []
    if (suggestUserIds.includes(currentUser._id)) {
      suggestUserIds = without(suggestUserIds, currentUser._id);
    }
    void updatePost({
      selector: { _id: post._id },
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  if (!userCanDo(currentUser, "posts.moderate.all")
    && !userIsMemberOf(currentUser, 'canSuggestCuration')) {
    return null;
  }
  if (isAF) {
    return null;
  }

  if (!post?.frontpageDate) {
    return (
      <DropdownItem
        title={preferredHeadingCase("Suggest Curation")}
        sideMessage="Must be frontpage"
        disabled
      />
    );
  }

  if (post.curatedDate && post.reviewForCuratedUserId) {
    return null;
  }

  const isSuggested = post.suggestForCuratedUserIds?.includes(currentUser._id);
  const title = isSuggested ? "Unsuggest Curation" : "Suggest Curation";
  const onClick = isSuggested ? handleUnsuggestCurated : handleSuggestCurated;
  return (
    <DropdownItem
      title={preferredHeadingCase(title)}
      onClick={onClick}
    />
  );
}

const SuggestCuratedDropdownItemComponent = registerComponent(
  'SuggestCuratedDropdownItem',
  SuggestCuratedDropdownItem,
);

declare global {
  interface ComponentTypes {
    SuggestCuratedDropdownItem: typeof SuggestCuratedDropdownItemComponent
  }
}

export default SuggestCuratedDropdownItemComponent;
