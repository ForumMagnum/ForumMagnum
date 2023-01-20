import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../../hooks/useUpdateCurrentUser';
import { useMessages } from '../../common/withMessages';
import { userOwns } from '../../../lib/vulcan-users/permissions';
import { userCanModeratePost } from '../../../lib/collections/users/helpers';
import { useCurrentUser } from '../../common/withUser';
import * as _ from 'underscore';

const BanUserFromAllPersonalPostsMenuItem = ({comment, post}: {
  comment: CommentsList,
  post: PostsBase,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const {flash} = useMessages();
  const { MenuItem } = Components;
  
  const handleBanUserFromAllPosts = (event: React.MouseEvent) => {
    if (!currentUser) return;
    event.preventDefault();
    if (confirm("Are you sure you want to ban this user from commenting on all your personal blog posts?")) {
      const commentUserId = comment.userId
      let bannedPersonalUserIds = _.clone(currentUser.bannedPersonalUserIds) || []
      if (!bannedPersonalUserIds.includes(commentUserId)) {
        bannedPersonalUserIds.push(commentUserId)
      }
      void updateCurrentUser({
        bannedPersonalUserIds: bannedPersonalUserIds
      }).then(()=>flash({messageString: `User ${comment?.user?.displayName} is now banned from commenting on any of your personal blog posts`}))
    }
  }

  if (userCanModeratePost(currentUser, post) && !post.frontpageDate && userOwns(currentUser, post)) {
    return <MenuItem onClick={handleBanUserFromAllPosts}>
      Ban from all your personal blog posts
    </MenuItem>
  } else {
    return null
  }
}

const BanUserFromAllPersonalPostsMenuItemComponent = registerComponent('BanUserFromAllPersonalPostsMenuItem', BanUserFromAllPersonalPostsMenuItem);

declare global {
  interface ComponentTypes {
    BanUserFromAllPersonalPostsMenuItem: typeof BanUserFromAllPersonalPostsMenuItemComponent,
  }
}

