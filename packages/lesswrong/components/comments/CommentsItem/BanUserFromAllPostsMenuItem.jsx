import React, { PureComponent } from 'react';
import { registerComponent, withMessages, withEdit } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import Users from 'meteor/vulcan:users';
import withUser from '../../common/withUser';

class BanUserFromAllPostsMenuItem extends PureComponent {
  handleBanUserFromAllPosts = (event) => {
    event.preventDefault();
    if (confirm("Are you sure you want to ban this user from commenting on all your posts?")) {
      const commentUserId = this.props.comment.userId
      let bannedUserIds = _.clone(this.props.currentUser.bannedUserIds) || []
      if (!bannedUserIds.includes(commentUserId)) {
        bannedUserIds.push(commentUserId)
      }
      this.props.editMutation({
        documentId: this.props.currentUser._id,
        set: {bannedUserIds:bannedUserIds},
        unset: {}
      }).then(()=>this.props.flash({messageString: `User ${this.props.comment.user.displayName} is now banned from commenting on any of your posts`}))
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

const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersProfile',
};


registerComponent('BanUserFromAllPostsMenuItem', BanUserFromAllPostsMenuItem, withMessages, [withEdit, withEditOptions], withUser);
export default BanUserFromAllPostsMenuItem;
