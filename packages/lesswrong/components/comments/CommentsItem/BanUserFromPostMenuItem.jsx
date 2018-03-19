import React, { PureComponent } from 'react';
import { registerComponent, withMessages, withEdit } from 'meteor/vulcan:core';
import MenuItem from 'material-ui/MenuItem';
import { Posts } from 'meteor/example-forum';
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
      this.props.editMutation({
        documentId: this.props.comment.postId,
        set: {bannedUserIds:bannedUserIds},
        unset: {}
      }).then(()=>this.props.flash(`User ${this.props.comment.user.displayName} is now banned from commenting on ${this.props.post.title}`))
    }
  }

  render() {
    return <MenuItem className="comment-menu-item-ban-from-post" onTouchTap={ this.handleBanUserFromPost } primaryText="From This Post" />
  }
}

// TODO - fix RecentCommentsItem so it doesn't throw an error due to the requiredProps, and then uncomment this

BanUserFromPostMenuItem.propTypes = {
  post: PropTypes.object.isRequired,
  comment: PropTypes.object.isRequired,
};

const withEditOptions = {
  collection: Posts,
  fragmentName: 'LWPostsPage',
};

registerComponent('BanUserFromPostMenuItem', BanUserFromPostMenuItem, withMessages, [withEdit, withEditOptions]);
export default BanUserFromPostMenuItem;
