import { useForumType } from '@/components/hooks/useForumType';
import React from 'react';
import { userCanSuggestPostsForCuration } from '../../../lib/collections/posts/helpers';
import { useCurrentUser } from '../../common/withUser';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const SetPostSuggestedForCurationMutation = gql(`
  mutation setPostSuggestedForCurationSuggestCuratedDropdownItem($postId: String!, $suggested: Boolean!) {
    setPostSuggestedForCuration(postId: $postId, suggested: $suggested) {
      ...PostsList
    }
  }
`);

const SuggestCuratedDropdownItem = ({post}: {post: PostsBase}) => {
  const { isAF } = useForumType();
  const currentUser = useCurrentUser();
  const [setPostSuggestedForCuration] = useMutation(SetPostSuggestedForCurationMutation);

  if (!currentUser || !userCanSuggestPostsForCuration(currentUser)) {
    return null;
  }
  if (isAF) {
    return null;
  }

  if (!post?.frontpageDate) {
    return (
      <DropdownItem
        title={"Suggest Curation"}
        sideMessage="Must be frontpage"
        disabled
      />
    );
  }

  if (post.curatedDate && post.reviewForCuratedUserId) {
    return null;
  }

  const isSuggested = !!post.suggestForCuratedUserIds?.includes(currentUser._id);
  const title = isSuggested ? "Unsuggest Curation" : "Suggest Curation";
  return (
    <DropdownItem
      title={title}
      onClick={() => void setPostSuggestedForCuration({
        variables: { postId: post._id, suggested: !isSuggested }
      })}
    />
  );
}

export default SuggestCuratedDropdownItem;
