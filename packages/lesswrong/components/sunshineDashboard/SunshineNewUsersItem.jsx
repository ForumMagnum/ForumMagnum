/* global confirm */
import { Components as c, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
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
        <c.SunshineListItem>
          <Popper open={hover} anchorEl={anchorEl} placement="left-start">
            <c.SidebarHoverOver width={250}>
              <Typography variant="body2">
                <Link to={Users.getProfileUrl(user)}>
                  { user.displayName }
                </Link>
                <br/>
                <c.MetaInfo>
                  <div>Posts: { user.postCount || 0 }</div>
                  <div>Comments: { user.commentCount || 0 }</div>
                  <hr />
                  <div>Big Upvotes: { user.bigUpvoteCount || 0 }</div>
                  <div>Upvotes: { user.smallUpvoteCount || 0 }</div>
                  <div>Big Downvotes: { user.bigDownvoteCount || 0 }</div>
                  <div>Downvotes: { user.smallDownvoteCount || 0 }</div>
                </c.MetaInfo>
              </Typography>
            </c.SidebarHoverOver>
          </Popper>
          <div>
            <c.MetaInfo>
              <Link to={Users.getProfileUrl(user)}>
                  {user.displayName}
              </Link>
            </c.MetaInfo>
            <c.MetaInfo>
              { user.karma || 0 }
            </c.MetaInfo>
            <c.MetaInfo>
              { user.email }
            </c.MetaInfo>
            <c.MetaInfo>
              { moment(new Date(user.createdAt)).fromNow() }
            </c.MetaInfo>
          </div>

          { hover && <c.SidebarActionMenu>
            <c.SidebarAction title="Review" onClick={this.handleReview}>
              done
            </c.SidebarAction>
            <c.SidebarAction warningHighlight={true} title="Purge User (delete and ban)" onClick={this.handlePurge}>
              delete_forever
            </c.SidebarAction>
          </c.SidebarActionMenu>}
        </c.SunshineListItem>
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
