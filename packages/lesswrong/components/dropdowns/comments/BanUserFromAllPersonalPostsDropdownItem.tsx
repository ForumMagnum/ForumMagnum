import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../../hooks/useUpdateCurrentUser';
import { useMessages } from '../../common/withMessages';
import { userOwns } from '../../../lib/vulcan-users/permissions';
import { userCanModeratePost } from '../../../lib/collections/users/helpers';
import { useCurrentUser } from '../../common/withUser';
import { clone } from 'underscore';
import DropdownItem from "../DropdownItem";

const BanUserFromAllPersonalPostsDropdownItem = ({comment, post}: {
  comment: CommentsList,
  post?: PostsBase,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const {flash} = useMessages();

  if (
    !post ||
    !userCanModeratePost(currentUser, post) ||
    post.frontpageDate ||
    !userOwns(currentUser, post)
  ) {
    return null;
  }

  const handleBanUserFromAllPosts = (event: React.MouseEvent) => {
    if (!currentUser) return;
    event.preventDefault();
    if (confirm("Are you sure you want to ban this user from commenting on all your personal blog posts?")) {
      const commentUserId = comment.userId ?? '';
      let bannedPersonalUserIds = clone(currentUser.bannedPersonalUserIds) || []
      if (!bannedPersonalUserIds.includes(commentUserId)) {
        bannedPersonalUserIds.push(commentUserId)
      }
      void updateCurrentUser({
        bannedPersonalUserIds: bannedPersonalUserIds
      }).then(()=>flash({messageString: `User ${comment?.user?.displayName} is now banned from commenting on any of your personal blog posts`}))
    }
  }
  return (
    <DropdownItem
      title="Ban from all your personal blog posts"
      onClick={handleBanUserFromAllPosts}
    />
  );
}

export default registerComponent(
  'BanUserFromAllPersonalPostsDropdownItem', BanUserFromAllPersonalPostsDropdownItem,
);



