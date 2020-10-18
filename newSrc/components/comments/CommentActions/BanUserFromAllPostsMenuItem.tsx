import React, { PureComponent } from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { withUpdate } from '../../../lib/crud/withUpdate';
import { withMessages } from '../../common/withMessages';
import MenuItem from '@material-ui/core/MenuItem';
import Users from '../../../lib/collections/users/collection';
import withUser from '../../common/withUser';
import * as _ from 'underscore';

interface ExternalProps {
  comment: CommentsList,
  post: PostsBase,
}
interface BanUserFromAllPostsMenuItemProps extends ExternalProps, WithMessagesProps, WithUserProps, WithUpdateUserProps {
}

class BanUserFromAllPostsMenuItem extends PureComponent<BanUserFromAllPostsMenuItemProps,{}> {
  handleBanUserFromAllPosts = (event: React.MouseEvent) => {
    const { comment, currentUser, updateUser, flash } = this.props;
    event.preventDefault();
    if (!currentUser) return;
    if (confirm("Are you sure you want to ban this user from commenting on all your posts?")) {
      const commentUserId = comment.userId
      let bannedUserIds = _.clone(currentUser.bannedUserIds) || []
      if (!bannedUserIds.includes(commentUserId)) {
        bannedUserIds.push(commentUserId)
      }
      updateUser({
        selector: { _id: currentUser._id },
        data: {bannedUserIds:bannedUserIds}
      }).then(()=>flash({messageString: `User ${comment?.user?.displayName} is now banned from commenting on any of your posts`}))
    }
  }

  render() {
    const { currentUser, post} = this.props
    if (Users.canModeratePost(currentUser, post) && post.frontpageDate && Users.owns(currentUser, post)) {
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
      withUpdate({
        collection: Users,
        fragmentName: 'UsersProfile',
      }),
      withUser
    ]
  }
);

declare global {
  interface ComponentTypes {
    BanUserFromAllPostsMenuItem: typeof BanUserFromAllPostsMenuItemComponent,
  }
}

