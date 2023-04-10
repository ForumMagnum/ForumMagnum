import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../../hooks/useUpdateCurrentUser';
import { useMessages } from '../../common/withMessages';
import { userOwns } from '../../../lib/vulcan-users/permissions';
import { userCanModeratePost } from '../../../lib/collections/users/helpers';
import { useCurrentUser } from '../../common/withUser';
import * as _ from 'underscore';

const BanUserFromAllPostsMenuItem = ({comment, post}: {
  comment: CommentsList,
  post: PostsBase,
}) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const { flash } = useMessages();
  const { MenuItem } = Components;
  
  const handleBanUserFromAllPosts = (event: React.MouseEvent) => {
    event.preventDefault();
    if (!currentUser) return;
    if (confirm("Are you sure you want to ban this user from commenting on all your posts?")) {
      const commentUserId = comment.userId
      let bannedUserIds = _.clone(currentUser.bannedUserIds) || []
      if (!bannedUserIds.includes(commentUserId)) {
        bannedUserIds.push(commentUserId)
      }
      void updateCurrentUser({
        bannedUserIds:bannedUserIds
      }).then(()=>flash({messageString: `User ${comment?.user?.displayName} is now banned from commenting on any of your posts`}))
    }
  }

  if (userCanModeratePost(currentUser, post) && post.frontpageDate && userOwns(currentUser, post)) {
    return <MenuItem onClick={ handleBanUserFromAllPosts }>
      Ban from all your posts
    </MenuItem>
  } else {
    return null
  }
}

const BanUserFromAllPostsMenuItemComponent = registerComponent('BanUserFromAllPostsMenuItem', BanUserFromAllPostsMenuItem);

declare global {
  interface ComponentTypes {
    BanUserFromAllPostsMenuItem: typeof BanUserFromAllPostsMenuItemComponent,
  }
}

