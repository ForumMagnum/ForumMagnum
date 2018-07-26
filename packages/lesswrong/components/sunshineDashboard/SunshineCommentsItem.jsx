import { Components, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import FontIcon from 'material-ui/FontIcon';

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
          <Components.SunshineCommentsItemOverview comment={comment}/>
          <div className="sunshine-sidebar-posts-actions new-comment">
            <Link
              className="sunshine-sidebar-posts-action new-comment clear"
              target="_blank"
              title="Spam (delete immediately)"
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
registerComponent('SunshineCommentsItem', SunshineCommentsItem, [withEdit, withEditOptions], withCurrentUser);
