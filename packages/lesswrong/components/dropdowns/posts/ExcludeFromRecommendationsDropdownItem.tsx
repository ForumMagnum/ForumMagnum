import React, { useCallback } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useCurrentUser } from '../../common/withUser';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { preferredHeadingCase } from '../../../themes/forumTheme';


const ExcludeFromRecommendationsDropdownItem = ({post}: {
  post: PostsList|SunshinePostsList,
}) => {
  const currentUser = useCurrentUser();
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: "PostsList",
  });

  const handleToggleDisableRecommendations = useCallback(() => {
    void updatePost({
      selector: {_id: post._id},
      data: {
        disableRecommendation: !post.disableRecommendation,
      },
    });
  }, [post, updatePost]);

  if (!userCanDo(currentUser, "posts.edit.all")) {
    return null;
  }

  const label = post.disableRecommendation
    ? "Include in Recommendations"
    : "Exclude from Recommendations"

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title={preferredHeadingCase(label)}
      onClick={handleToggleDisableRecommendations}
    />
  );
}

const ExcludeFromRecommendationsDropdownItemComponent = registerComponent(
  'ExcludeFromRecommendationsDropdownItem',
  ExcludeFromRecommendationsDropdownItem,
);

declare global {
  interface ComponentTypes {
    ExcludeFromRecommendationsDropdownItem: typeof ExcludeFromRecommendationsDropdownItemComponent
  }
}
