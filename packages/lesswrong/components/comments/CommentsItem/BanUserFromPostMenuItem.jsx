import React, { PureComponent } from 'react';
import { registerComponent, withMessages, withUpdate } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import { Posts } from '../../../lib/collections/posts';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import withUser from '../../common/withUser';

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
      this.props.updateUser({
        selector: {_id: this.props.comment.postId},
        data: {bannedUserIds:bannedUserIds}
      }).then(()=>this.props.flash({messageString: `User ${this.props.comment.user.displayName} is now banned from commenting on ${this.props.post.title}`}))
    }
  }

  render() {
    const { currentUser, post} = this.props
    if (Users.canModeratePost(currentUser, post)) {
        return <MenuItem onClick={ this.handleBanUserFromPost }>
          Ban user from this post
        </MenuItem>
      } else {
        return null
      }
  }
}

// TODO - fix ParentCommentItem so it doesn't throw an error due to the requiredProps, and then uncomment this

BanUserFromPostMenuItem.propTypes = {
  post: PropTypes.object.isRequired,
  comment: PropTypes.object.isRequired,
};

const withUpdateOptions = {
  collection: Posts,
  fragmentName: 'PostsPage',
};

registerComponent('BanUserFromPostMenuItem', BanUserFromPostMenuItem, withMessages, [withUpdate, withUpdateOptions], withUser);
export default BanUserFromPostMenuItem;
