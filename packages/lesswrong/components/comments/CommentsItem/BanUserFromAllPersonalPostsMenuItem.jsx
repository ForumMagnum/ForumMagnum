import React, { PureComponent } from 'react';
import { registerComponent, withMessages, withEdit } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import Users from 'meteor/vulcan:users';
import withUser from '../../common/withUser';

class BanUserFromAllPersonalPostsMenuItem extends PureComponent {
  handleBanUserFromAllPosts = (event) => {
    event.preventDefault();
    if (confirm("Are you sure you want to ban this user from commenting on all your personal blog posts?")) {
      const commentUserId = this.props.comment.userId
      let bannedPersonalUserIds = _.clone(this.props.currentUser.bannedPersonalUserIds) || []
      if (!bannedPersonalUserIds.includes(commentUserId)) {
        bannedPersonalUserIds.push(commentUserId)
      }
      this.props.editMutation({
        documentId: this.props.currentUser._id,
        set: {bannedPersonalUserIds:bannedPersonalUserIds},
        unset: {}
      }).then(()=>this.props.flash({messageString: `User ${this.props.comment.user.displayName} is now banned from commenting on any of your personal blog posts`}))
    }
  }

  render() {
    const { currentUser, post} = this.props
    if (Users.canModeratePost(currentUser, post) && !post.frontpageDate && Users.owns(currentUser, post)) {
        return <MenuItem onClick={ this.handleBanUserFromAllPosts }>
          Ban from all your personal blog posts
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


registerComponent('BanUserFromAllPersonalPostsMenuItem', BanUserFromAllPersonalPostsMenuItem, withMessages, [withEdit, withEditOptions], withUser);
export default BanUserFromAllPersonalPostsMenuItem;
