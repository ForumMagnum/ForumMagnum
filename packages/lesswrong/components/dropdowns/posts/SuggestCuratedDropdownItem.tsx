import { registerComponent } from '../../../lib/vulcan-lib/components';
import React from 'react';
import { userCanDo, userIsMemberOf } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import { isAF } from '../../../lib/instanceSettings';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const PostsListUpdateMutation = gql(`
  mutation updatePostSuggestCuratedDropdownItem($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsList
      }
    }
  }
`);

const SuggestCuratedDropdownItem = ({post}: {post: PostsBase}) => {
  const currentUser = useCurrentUser();
  const [updatePost] = useMutation(PostsListUpdateMutation);
  
  if (!currentUser)
    return null;
  
  const handleSuggestCurated = () => {
    let suggestUserIds = [...post.suggestForCuratedUserIds ?? []]
    if (!suggestUserIds.includes(currentUser._id)) {
      suggestUserIds.push(currentUser._id)
    }
    void updatePost({
      variables: {
        selector: { _id: post._id },
        data: { suggestForCuratedUserIds: suggestUserIds }
      }
    })
  }

  const handleUnsuggestCurated = () => {
    let suggestUserIds = [...post.suggestForCuratedUserIds ?? []]
    if (suggestUserIds.includes(currentUser._id)) {
      suggestUserIds = suggestUserIds.filter(id => id !== currentUser._id);
    }
    void updatePost({
      variables: {
        selector: { _id: post._id },
        data: { suggestForCuratedUserIds: suggestUserIds }
      }
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

export default registerComponent(
  'SuggestCuratedDropdownItem',
  SuggestCuratedDropdownItem,
);


