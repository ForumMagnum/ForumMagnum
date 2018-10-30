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

class SunshineReportsItem extends Component {

  handleReview = () => {
    const { currentUser, report, reportEditMutation } = this.props
    reportEditMutation({
      documentId: report._id,
      set: {
        closedAt: new Date(),
        claimedUserId: currentUser._id
      },
      unset: {}
    })
  }

  handleDelete = () => {
    const {
      currentUser,
      report,
      editMutation,
      reportEditMutation
    } = this.props
    if (confirm("Are you sure you want to immediately delete this comment?")) {
      editMutation({
        documentId: report.comment && report.comment._id,
        set: {
          deleted: true,
          deletedDate: new Date(),
          deletedByUserId: currentUser._id,
          deletedReason: "spam"
        },
        unset: {}
      })
      reportEditMutation({
        documentId: report._id,
        set: {
          closedAt: new Date(),
          claimedUserId: currentUser._id
        },
        unset: {}
      })
    }
  }

  render () {
    const { report } = this.props
    const comment = report.comment

    if (report) {
      return (
        <div className="sunshine-sidebar-item new-report" >
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

              <Typography variant="caption">
                <div>
                  Reported by {report.user.displayName} <Components.FromNowDate date={report.createdAt}/>
                </div>
                <div>"{ report.description }"</div>
              </Typography>
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

registerComponent(
  'SunshineReportsItem',
  SunshineReportsItem,
  [withEdit, withEditOptions],
  withUser,
  withErrorBoundary
);
