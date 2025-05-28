import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useMessages } from '../../common/withMessages';
import { userCanModeratePost } from '../../../lib/collections/users/helpers';
import { useCurrentUser } from '../../common/withUser';
import { clone } from 'underscore';
import DropdownItem from "../DropdownItem";
import { useMutation } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

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

  if (!post || !userCanModeratePost(currentUser, post)) {
    return null;
  }

  const handleBanUserFromPost = (event: React.MouseEvent) => {
    event.preventDefault();
    if (confirm("Are you sure you want to ban this user from commenting on this post?")) {
      const commentUserId = comment.userId ?? '';
      let bannedUserIds = clone(post.bannedUserIds) || []
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

export default registerComponent(
  'BanUserFromPostDropdownItem', BanUserFromPostDropdownItem,
);



