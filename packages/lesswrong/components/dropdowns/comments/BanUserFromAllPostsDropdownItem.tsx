import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../../hooks/useUpdateCurrentUser';
import { useMessages } from '../../common/withMessages';
import { userOwns } from '../../../lib/vulcan-users/permissions';
import { userCanModeratePost } from '../../../lib/collections/users/helpers';
import { useCurrentUser } from '../../common/withUser';
import { clone } from 'underscore';

const BanUserFromAllPostsDropdownItem = ({comment, post}: {
  comment: CommentsList,
  post?: PostsBase,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const {flash} = useMessages();

  if (
    !post ||
    !userCanModeratePost(currentUser, post) ||
    !post.frontpageDate ||
    !userOwns(currentUser, post)
  ) {
    return null;
  }

  const handleBanUserFromAllPosts = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!currentUser) return;
    if (confirm("Are you sure you want to ban this user from commenting on all your posts?")) {
      const commentUserId = comment.userId ?? '';
      let bannedUserIds = clone(currentUser.bannedUserIds) || []
      if (!bannedUserIds.includes(commentUserId)) {
        bannedUserIds.push(commentUserId)
      }
      void updateCurrentUser({
        bannedUserIds:bannedUserIds
      }).then(()=>flash({messageString: `User ${comment?.user?.displayName} is now banned from commenting on any of your posts`}))
    }
  }

  const {DropdownItem} = Components;
  return (
    <DropdownItem
      title="Ban from all your posts"
      onClick={handleBanUserFromAllPosts}
    />
  );
}

const BanUserFromAllPostsDropdownItemComponent = registerComponent(
  'BanUserFromAllPostsDropdownItem', BanUserFromAllPostsDropdownItem,
);

declare global {
  interface ComponentTypes {
    BanUserFromAllPostsDropdownItem: typeof BanUserFromAllPostsDropdownItemComponent,
  }
}

