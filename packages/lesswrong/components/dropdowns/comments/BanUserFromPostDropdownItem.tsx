import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useMessages } from '../../common/withMessages';
import { userCanModeratePost } from '../../../lib/collections/users/helpers';
import { useCurrentUser } from '../../common/withUser';
import { clone } from 'underscore';
import { DropdownItem } from "../DropdownItem";

const BanUserFromPostDropdownItemInner = ({comment, post}: {
  comment: CommentsList,
  post?: PostsDetails,
}) => {
  const currentUser = useCurrentUser();
  const {flash} = useMessages();
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsPage',
  });

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
        selector: {_id: comment.postId},
        data: {bannedUserIds:bannedUserIds}
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

export const BanUserFromPostDropdownItem = registerComponent(
  'BanUserFromPostDropdownItem', BanUserFromPostDropdownItemInner,
);



