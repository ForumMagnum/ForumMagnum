import React, { PureComponent } from 'react';
import { withMessages, withEdit } from 'meteor/vulcan:core';
import MenuItem from 'material-ui/MenuItem';
import Users from 'meteor/vulcan:users';
import PropTypes from 'prop-types';
import defineComponent from '../../../lib/defineComponent';

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
      this.props.editMutation({
        documentId: this.props.currentUser._id,
        set: {bannedUserIds:bannedUserIds},
        unset: {}
      }).then(()=>this.props.flash(`User ${this.props.comment.user.displayName} is now banned from commenting on any of your posts`))
    }
  }

  render() {
    return <MenuItem
      className="comment-menu-item-ban-from-user"
      onClick={ this.handleBanUserFromAllPosts }
      primaryText="From All Your Posts" />
  }
}

const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersProfile',
};


export default defineComponent({
  name: 'BanUserFromAllPostsMenuItem',
  component: BanUserFromAllPostsMenuItem,
  hocs: [ withMessages, [withEdit, withEditOptions] ]
});
