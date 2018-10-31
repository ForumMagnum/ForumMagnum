import { Components, registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments } from '../../lib/collections/comments';
import { Link } from 'react-router'
import Typography from '@material-ui/core/Typography';
import { Posts } from '../../lib/collections/posts';
import withHover from '../common/withHover'
import Users from 'meteor/vulcan:users';
import PropTypes from 'prop-types';
import withUser from '../common/withUser'
import withErrorBoundary from '../common/withErrorBoundary'

class SunshineNewCommentsItem extends Component {

  handleReview = () => {
    const { currentUser, comment, editMutation } = this.props
    editMutation({
      documentId: comment._id,
      set: {reviewedByUserId : currentUser._id},
      unset: {}
    })
  }

  handleDelete = () => {
    const { currentUser, comment, editMutation } = this.props
    if (confirm("Are you sure you want to immediately delete this comment?")) {
      window.open(Users.getProfileUrl(comment.user), '_blank');
      editMutation({
        documentId: comment._id,
        set: {
          deleted: true,
          deletedDate: new Date(),
          deletedByUserId: currentUser._id,
          deletedReason: "spam"
        },
        unset: {}
      })
    }
  }

  render () {
    const { comment, hover, anchorEl } = this.props
    return (
        <Components.SunshineListItem hover={hover}>
          <Components.SidebarHoverOver hover={hover} anchorEl={anchorEl} >
            <Typography variant="body2">
              <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
                Commented on post: <strong>{ comment.post.title }</strong>
              </Link>
              <Components.CommentBody comment={comment}/>
            </Typography>
          </Components.SidebarHoverOver>
          <Components.SunshineCommentsItemOverview comment={comment}/>
            {hover && <Components.SidebarActionMenu>
              <Components.SidebarAction title="Mark as Reviewed" onClick={this.handleReview}>
                done
              </Components.SidebarAction>
              <Components.SidebarAction title="Spam/Eugin (delete immediately)" onClick={this.handleDelete} warningHighlight>
                clear
              </Components.SidebarAction>
            </Components.SidebarActionMenu>}
        </Components.SunshineListItem>
    )
  }
}

SunshineNewCommentsItem.propTypes = {
  currentUser: PropTypes.object.isRequired,
  editMutation: PropTypes.func.isRequired,
  comment: PropTypes.object.isRequired,
  hover: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
}

const withEditOptions = {
  collection: Comments,
  fragmentName: 'SelectCommentsList',
}
registerComponent('SunshineNewCommentsItem', SunshineNewCommentsItem, [withEdit, withEditOptions], withUser, withHover, withErrorBoundary);
