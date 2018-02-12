import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { MenuItem } from 'material-ui';
import Users from 'meteor/vulcan:users';
import PropTypes from 'prop-types';

class BanUserFromPostMenuItem extends PureComponent {

  constructor(props) {
    super(props);
  }

  handleBanUserFromPost = (event) => {
    event.preventDefault();
    if (confirm("Are you sure you want to ban this user from commenting on this post?")) {
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
  }

  render() {
    if (this.props.comment && Users.canModeratePost(this.props.currentUser, this.props.post)) {
      return <MenuItem className="comment-menu-item-ban-from-post" onTouchTap={ this.handleBanUserFromPost } primaryText="From This Post" />
    } else {
      return null
    }
  }
}

// TODO - fix RecentCommentsItem so it doesn't throw an error due to the requiredProps, and then uncomment this

// BanUserFromPostMenuItem.propTypes = {
//   postEditMutation: PropTypes.func.isRequired,
// };

registerComponent('BanUserFromPostMenuItem', BanUserFromPostMenuItem);
export default BanUserFromPostMenuItem;
