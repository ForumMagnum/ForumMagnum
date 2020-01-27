import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withUpdate } from '../../../lib/crud/withUpdate';
import { withMessages } from '../../common/withMessages';
import MenuItem from '@material-ui/core/MenuItem';
import { Posts } from '../../../lib/collections/posts';
import PropTypes from 'prop-types';
import Users from 'meteor/vulcan:users';
import withUser from '../../common/withUser';
import * as _ from 'underscore';

interface BanUserFromPostMenuItemProps extends WithMessagesProps, WithUserProps {
  comment: any,
  post: any,
  updateUser?: any,
}

class BanUserFromPostMenuItem extends PureComponent<BanUserFromPostMenuItemProps,{}> {

  constructor(props: BanUserFromPostMenuItemProps) {
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
};

const BanUserFromPostMenuItemComponent = registerComponent(
  'BanUserFromPostMenuItem', BanUserFromPostMenuItem,
  withMessages,
  withUpdate({
    collection: Posts,
    fragmentName: 'PostsPage',
  }),
  withUser
);

declare global {
  interface ComponentTypes {
    BanUserFromPostMenuItem: typeof BanUserFromPostMenuItemComponent,
  }
}

