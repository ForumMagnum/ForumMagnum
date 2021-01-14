import React, { PureComponent } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { withUpdateCurrentUser, WithUpdateCurrentUserProps } from '../../hooks/useUpdateCurrentUser';
import { withMessages } from '../../common/withMessages';
import MenuItem from '@material-ui/core/MenuItem';
import { userOwns } from '../../../lib/vulcan-users/permissions';
import { userCanModeratePost } from '../../../lib/collections/users/helpers';
import withUser from '../../common/withUser';
import * as _ from 'underscore';

interface ExternalProps {
  comment: CommentsList,
  post: PostsBase,
}
interface BanUserFromAllPostsMenuItemProps extends ExternalProps, WithMessagesProps, WithUserProps, WithUpdateCurrentUserProps {
}

class BanUserFromAllPostsMenuItem extends PureComponent<BanUserFromAllPostsMenuItemProps,{}> {
  handleBanUserFromAllPosts = (event: React.MouseEvent) => {
    const { comment, currentUser, updateCurrentUser, flash } = this.props;
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

  render() {
    const { currentUser, post} = this.props
    if (userCanModeratePost(currentUser, post) && post.frontpageDate && userOwns(currentUser, post)) {
        return <MenuItem onClick={ this.handleBanUserFromAllPosts }>
          Ban from all your posts
        </MenuItem>
      } else {
        return null
      }
  }
}

const BanUserFromAllPostsMenuItemComponent = registerComponent<ExternalProps>(
  'BanUserFromAllPostsMenuItem', BanUserFromAllPostsMenuItem, {
    hocs: [
      withMessages,
      withUpdateCurrentUser,
      withUser
    ]
  }
);

declare global {
  interface ComponentTypes {
    BanUserFromAllPostsMenuItem: typeof BanUserFromAllPostsMenuItemComponent,
  }
}

