/* global confirm */
import { Components as C, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import moment from 'moment';
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import withHover from '../common/withHover'
import Popper from '@material-ui/core/Popper';

class SunshineNewUsersItem extends Component {

  handleReview = () => {
    const { currentUser, user, editMutation } = this.props
    editMutation({
      documentId: user._id,
      set: {reviewedByUserId: currentUser._id},
      unset: {}
    })
  }

  handlePurge = () => {
    const { currentUser, user, editMutation } = this.props
    if (confirm("Are you sure you want to delete all this user's posts, comments and votes?")) {
      editMutation({
        documentId: user._id,
        set: {
          reviewedByUserId: currentUser._id,
          nullifyVotes: true,
          voteBanned: true,
          deleteContent: true,
          banned: moment().add(12, 'months').toDate()
        },
        unset: {}
      })
    }
  }

  render () {
    const { user, hover, anchorEl } = this.props
    return (
        <C.SunshineListItem hover={hover}>
          <Popper open={hover} anchorEl={anchorEl} placement="left-start">
            <C.SidebarHoverOver width={250}>
              <Typography variant="body2">
                <Link to={Users.getProfileUrl(user)}>
                  { user.displayName }
                </Link>
                <br/>
                <C.MetaInfo>
                  <div>Posts: { user.postCount || 0 }</div>
                  <div>Comments: { user.commentCount || 0 }</div>
                  <hr />
                  <div>Big Upvotes: { user.bigUpvoteCount || 0 }</div>
                  <div>Upvotes: { user.smallUpvoteCount || 0 }</div>
                  <div>Big Downvotes: { user.bigDownvoteCount || 0 }</div>
                  <div>Downvotes: { user.smallDownvoteCount || 0 }</div>
                </C.MetaInfo>
              </Typography>
            </C.SidebarHoverOver>
          </Popper>
          <div>
            <C.MetaInfo>
              <Link to={Users.getProfileUrl(user)}>
                  {user.displayName}
              </Link>
            </C.MetaInfo>
            <C.MetaInfo>
              { user.karma || 0 }
            </C.MetaInfo>
            <C.MetaInfo>
              { user.email }
            </C.MetaInfo>
            <C.MetaInfo>
              { moment(new Date(user.createdAt)).fromNow() }
            </C.MetaInfo>
          </div>

          { hover && <C.SidebarActionMenu>
            <C.SidebarAction title="Review" onClick={this.handleReview}>
              done
            </C.SidebarAction>
            <C.SidebarAction warningHighlight={true} title="Purge User (delete and ban)" onClick={this.handlePurge}>
              delete_forever
            </C.SidebarAction>
          </C.SidebarActionMenu>}
        </C.SunshineListItem>
    )
  }
}

SunshineNewUsersItem.propTypes = {
  user: PropTypes.object.isRequired,
}

const withEditOptions = {
  collection: Users,
  fragmentName: 'SunshineUsersList',
}
registerComponent('SunshineNewUsersItem', SunshineNewUsersItem, [withEdit, withEditOptions], withCurrentUser, withHover);
