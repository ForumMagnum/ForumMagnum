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

class BanUserFromPostMenuItem extends PureComponent {

  constructor(props) {
    super(props);
  }

  handleBanUserFromPost = (event) => {
    event.preventDefault();
    const commentUserId = this.props.comment.userId
    let bannedUserIds = _.clone(this.props.post.bannedUserIds) || []
    if (!bannedUserIds.includes(commentUserId)) {
      bannedUserIds.push(commentUserId)
    }
    this.props.postEditMutation({
      documentId: this.props.comment.postId,
      set: {bannedUserIds:bannedUserIds},
      unset: {}
    }).then(()=>console.log(`User ${commentUserId} added to post banned-list: ${bannedUserIds}`))
  }

  render() {
    if (this.props.comment && currentUserCanBan(this.props.currentUser, this.props.post)) {
      return <MenuItem className="comment-menu-item-ban-from-post" onTouchTap={ this.handleBanUserFromPost } primaryText="Ban User From Post" />
    } else {
      return null
    }
  }
}

registerComponent('BanUserFromPostMenuItem', BanUserFromPostMenuItem);
export default BanUserFromPostMenuItem;
