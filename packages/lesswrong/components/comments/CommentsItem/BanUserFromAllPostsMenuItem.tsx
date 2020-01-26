import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withUpdate } from '../../../lib/crud/withUpdate';
import { withMessages } from '../../common/withMessages';
import MenuItem from '@material-ui/core/MenuItem';
import Users from 'meteor/vulcan:users';
import withUser from '../../common/withUser';
import * as _ from 'underscore';

interface BanUserFromAllPostsMenuItemProps extends WithMessagesProps, WithUserProps {
  comment: any,
  updateUser?: any,
  post: any,
}

class BanUserFromAllPostsMenuItem extends PureComponent<BanUserFromAllPostsMenuItemProps,{}> {
  handleBanUserFromAllPosts = (event) => {
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
      }).then(()=>flash({messageString: `User ${comment.user.displayName} is now banned from commenting on any of your posts`}))
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

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersProfile',
};


const BanUserFromAllPostsMenuItemComponent = registerComponent('BanUserFromAllPostsMenuItem', BanUserFromAllPostsMenuItem, withMessages, [withUpdate, withUpdateOptions], withUser);

declare global {
  interface ComponentTypes {
    BanUserFromAllPostsMenuItem: typeof BanUserFromAllPostsMenuItemComponent,
  }
}

