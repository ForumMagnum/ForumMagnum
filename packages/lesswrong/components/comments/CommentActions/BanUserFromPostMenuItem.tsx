import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import { useMessages } from '../../common/withMessages';
import MenuItem from '@material-ui/core/MenuItem';
import { Posts } from '../../../lib/collections/posts';
import Users from '../../../lib/collections/users/collection';
import { useCurrentUser } from '../../common/withUser';
import * as _ from 'underscore';

const BanUserFromPostMenuItem = ({ comment, post }: {
  comment: CommentsList,
  post: PostsDetails,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const {mutate: updatePost} = useUpdate({
    collection: Posts,
    fragmentName: 'PostsPage',
  });

  const handleBanUserFromPost = (event: React.MouseEvent) => {
    event.preventDefault();
    if (confirm("Are you sure you want to ban this user from commenting on this post?")) {
      const commentUserId = comment.userId
      let bannedUserIds = _.clone(post.bannedUserIds) || []
      if (!bannedUserIds.includes(commentUserId)) {
        bannedUserIds.push(commentUserId)
      }
      updatePost({
        selector: {_id: comment.postId},
        data: {bannedUserIds:bannedUserIds}
      }).then(
        ()=>flash({messageString: `User ${comment.user.displayName} is now banned from commenting on ${post.title}`}),
        ()=>flash({messageString: `Error banning user ${comment.user.displayName}`})
      );
    }
  }

  if (Users.canModeratePost(currentUser, post)) {
    return <MenuItem onClick={handleBanUserFromPost}>
      Ban user from this post
    </MenuItem>
  } else {
    return null
  }
};

const BanUserFromPostMenuItemComponent = registerComponent('BanUserFromPostMenuItem', BanUserFromPostMenuItem);

declare global {
  interface ComponentTypes {
    BanUserFromPostMenuItem: typeof BanUserFromPostMenuItemComponent,
  }
}

