import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { MenuItem } from 'material-ui';
import Users from 'meteor/vulcan:users';
import PropTypes from 'prop-types';

class BanUserFromAllPostsMenuItem extends PureComponent {

  constructor(props) {
    super(props);
  }

  handleBanUserFromAllPosts = (event) => {
    event.preventDefault();
    if (confirm("Are you sure you want to ban this user from commenting on all your posts?")) {
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
  }

  render() {
    if (this.props.comment && Users.canModeratePost(this.props.currentUser, this.props.post)) {
      return <MenuItem className="comment-menu-item-ban-from-user" onTouchTap={ this.handleBanUserFromAllPosts } primaryText="From All Your Posts" />
    } else {
      return <span className="comment-menu-item-ban-from-user"></span>
    }
  }
}
// TODO - fix RecentCommentsItem so it doesn't throw an error due to the requiredProps, and then uncomment this
//
// BanUserFromAllPostsMenuItem.propTypes = {
//   userEditMutation: PropTypes.func.isRequired,
// };

registerComponent('BanUserFromAllPostsMenuItem', BanUserFromAllPostsMenuItem);
export default BanUserFromAllPostsMenuItem;
