import { Components, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments } from 'meteor/example-forum';
import { Link } from 'react-router'
import Typography from '@material-ui/core/Typography';
import { Posts } from 'meteor/example-forum';
import withHover from '../common/withHover'
import Popper from '@material-ui/core/Popper';
import Users from 'meteor/vulcan:users';


class SunshineCommentsItem extends Component {

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
    if (comment) {
      return (
          <Components.SunshineListItem hover={hover}>
            <Popper open={hover} anchorEl={anchorEl} placement="left-start">
              <Components.SidebarHoverOver>
                <Typography variant="body2">
                  <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
                    Commented on post: <strong>{ comment.post.title }</strong>
                  </Link>
                  <Components.CommentBody comment={comment}/>
                </Typography>
              </Components.SidebarHoverOver>
            </Popper>
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
    } else {
      return null
    }
  }
}

const withEditOptions = {
  collection: Comments,
  fragmentName: 'SelectCommentsList',
}
registerComponent('SunshineCommentsItem', SunshineCommentsItem, [withEdit, withEditOptions], withCurrentUser, withHover);
