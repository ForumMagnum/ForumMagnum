import React from 'react';
import { useMessages } from '../../common/withMessages';
import { userCanModeratePost } from '../../../lib/collections/users/helpers';
import { userOwns } from '../../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../../common/withUser';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const PostsPageUpdateMutation = gql(`
  mutation updatePostBanUserFromPostDropdownItem($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsPage
      }
    }
  }
`);

const BanUserFromPostDropdownItem = ({comment, post}: {
  comment: CommentsList,
  post?: PostsDetails,
}) => {
  const currentUser = useCurrentUser();
  const {flash} = useMessages();
  const [updatePost] = useMutation(PostsPageUpdateMutation);

  if (!post || comment.draft) {
    return null;
  }
  const moderationPermission = userCanModeratePost(currentUser, post);
  if (!moderationPermission.canModerate) {
    if (!userOwns(currentUser, post)) {
      return null;
    }
    return (
      <DropdownItem
        title="Ban user from this post"
        disabled
        tooltip={moderationPermission.reason}
      />
    );
  }

  const handleBanUserFromPost = (event: React.MouseEvent) => {
    event.preventDefault();
    if (confirm("Are you sure you want to ban this user from commenting on this post?")) {
      const commentUserId = comment.userId ?? '';
      let bannedUserIds = [...post.bannedUserIds ?? []]
      if (!bannedUserIds.includes(commentUserId)) {
        bannedUserIds.push(commentUserId)
      }
      updatePost({
        variables: {
          selector: { _id: comment.postId },
          data: { bannedUserIds: bannedUserIds }
        }
      }).then(
        ()=>flash({messageString: `User ${comment?.user?.displayName} is now banned from commenting on ${post.title}`}),
        ()=>flash({messageString: `Error banning user ${comment?.user?.displayName}`})
      );
    }
  }
  return (
    <DropdownItem
      title="Ban user from this post"
      onClick={handleBanUserFromPost}
    />
  );
};

export default BanUserFromPostDropdownItem;



