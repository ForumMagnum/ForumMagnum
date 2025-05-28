import React, { useCallback } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useCurrentUser } from '../../common/withUser';
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const PostsListUpdateMutation = gql(`
  mutation updatePostExcludeFromRecommendationsDropdownItem($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsList
      }
    }
  }
`);

const ExcludeFromRecommendationsDropdownItem = ({post}: {
  post: PostsList|SunshinePostsList,
}) => {
  const currentUser = useCurrentUser();
  const [updatePost] = useMutation(PostsListUpdateMutation);

  const handleToggleDisableRecommendations = useCallback(() => {
    void updatePost({
      variables: {
        selector: { _id: post._id },
        data: {
          disableRecommendation: !post.disableRecommendation,
        }
      }
    });
  }, [post, updatePost]);

  if (!userCanDo(currentUser, "posts.edit.all")) {
    return null;
  }

  const label = post.disableRecommendation
    ? "Include in Recommendations"
    : "Exclude from Recommendations"
  return (
    <DropdownItem
      title={preferredHeadingCase(label)}
      onClick={handleToggleDisableRecommendations}
    />
  );
}

export default registerComponent(
  'ExcludeFromRecommendationsDropdownItem',
  ExcludeFromRecommendationsDropdownItem,
);


