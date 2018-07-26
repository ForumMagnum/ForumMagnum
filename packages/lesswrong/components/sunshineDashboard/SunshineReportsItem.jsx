import { Components, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import FontIcon from 'material-ui/FontIcon';
import moment from 'moment';

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
        documentId: report.commentId,
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
    const report = this.props.report
    if (report) {
      return (
        <div className="sunshine-sidebar-item new-report">
          <Components.SunshineCommentsItemOverview comment={report.comment}/>
          <div className="sunshine-sidebar-reported-by">
            Reported by {report.user.displayName} { moment(new Date(report.createdAt)).fromNow() }
          </div>
          <div className="sunshine-sidebar-report-description">
            { report.description }
          </div>
          <div className="sunshine-sidebar-posts-actions new-comment">
            <Link
              className="sunshine-sidebar-posts-action new-comment clear"
              target="_blank"
              title="Spam (delete immediately)"
              to={Users.getProfileUrl(report.comment.user)}
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
registerComponent(
  'SunshineReportsItem',
  SunshineReportsItem,
  [withEdit, withEditOptions],
  withCurrentUser
);
