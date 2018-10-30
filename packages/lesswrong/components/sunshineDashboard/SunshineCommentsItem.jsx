import { Components, registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments } from '../../lib/collections/comments';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import FontIcon from 'material-ui/FontIcon';
import Typography from '@material-ui/core/Typography';
import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary'

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
    const comment = this.props.comment
    if (comment) {
      return (
        <div className="sunshine-sidebar-item new-comment">
          <Components.SidebarHoverOver
            hoverOverComponent={
              <Typography variant="body2">
                <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
                  Commented on post: <strong>{ comment.post.title }</strong>
                </Link>
                <Components.CommentBody comment={comment}/>
              </Typography>
            }
          >
            <Components.SunshineListItem>
              <Components.SunshineCommentsItemOverview comment={comment}/>
              <div className="sunshine-sidebar-posts-actions new-comment">
                <Link
                  className="sunshine-sidebar-posts-action new-comment clear"
                  target="_blank"
                  title="Spam/Eugin (delete immediately)"
                  to={Users.getProfileUrl(comment.user)}
                  onClick={this.handleDelete}>
                    <FontIcon
                      style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                      className="material-icons">
                        clear
                    </FontIcon>
                    <div className="sunshine-sidebar-posts-item-delete-overlay"/>
                </Link>
                <span
                  className="sunshine-sidebar-posts-action new-comment review"
                  title="Mark as Reviewed"
                  onClick={this.handleReview}>
                  <FontIcon
                    style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                    className="material-icons">
                      done
                  </FontIcon>
                </span>
              </div>
            </Components.SunshineListItem>
          </Components.SidebarHoverOver>
        </div>
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
registerComponent('SunshineCommentsItem', SunshineCommentsItem, [withEdit, withEditOptions], withUser, withErrorBoundary);
