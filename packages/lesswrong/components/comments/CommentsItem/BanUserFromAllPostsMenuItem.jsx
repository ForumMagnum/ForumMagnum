import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { MenuItem } from 'material-ui';
import Users from 'meteor/vulcan:users';

export const currentUserCanBan = (currentUser, post) => {
  return currentUser && post &&
    (
      Users.canDo(currentUser,"posts.moderate.all") ||
      (
        Users.canDo(currentUser,"posts.moderate.own") &&
        Users.owns(currentUser, post) &&
        post.user.moderationStyle
      )
    )
}

class BanUserFromAllPostsMenuItem extends PureComponent {

  constructor(props) {
    super(props);
  }

  handleBanUserFromAllPosts = (event) => {
    event.preventDefault();
    const commentUserId = this.props.comment.userId
    let bannedUserIds = _.clone(this.props.currentUser.bannedUserIds) || []
    if (!bannedUserIds.includes(commentUserId)) {
      bannedUserIds.push(commentUserId)
    }
    this.props.userEditMutation({
      documentId: this.props.currentUser._id,
      set: {bannedUserIds:bannedUserIds},
      unset: {}
    }).then(()=>console.log(`User ${commentUserId} added to post banned-list: ${bannedUserIds}`))
  }

  render() {
    if (this.props.comment && currentUserCanBan(this.props.currentUser, this.props.post)) {
      return <MenuItem className="comment-menu-item-ban-from-user" onTouchTap={ this.handleBanUserFromAllPosts } primaryText="Ban User" secondaryText="(from commenting on any of your posts)" />
    } else {
      return <span className="comment-menu-item-ban-from-user"></span>
    }
  }
}

registerComponent('BanUserFromAllPostsMenuItem', BanUserFromAllPostsMenuItem);
export default BanUserFromAllPostsMenuItem;
