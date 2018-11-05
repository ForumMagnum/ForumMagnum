import { Components, registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments } from '../../lib/collections/comments';
import { Link } from 'react-router'
import Typography from '@material-ui/core/Typography';
import { Posts } from '../../lib/collections/posts';
import withHover from '../common/withHover'
import PropTypes from 'prop-types'
import withErrorBoundary from '../common/withErrorBoundary'
import withUser from '../common/withUser'

class SunshineReportedCommentsItem extends Component {

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
      reportEditMutation,
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
    const { report, hover, anchorEl } = this.props
    const comment = report.comment

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
            <Components.SidebarInfo>
              <em>"{ report.description }"</em> – {report.user.displayName}, <Components.FromNowDate date={report.createdAt}/>
            </Components.SidebarInfo>
            {hover && <Components.SidebarActionMenu>
              <Components.SidebarAction title="Mark as Reviewed" onClick={this.handleReview}>
                done
              </Components.SidebarAction>
              <Components.SidebarAction title="Spam/Eugin (delete immediately)" onClick={this.handleDelete} warningHighlight>
                clear
              </Components.SidebarAction>
            </Components.SidebarActionMenu>
            }
          </Components.SunshineListItem>
    )
  }
}

const withEditOptions = {
  collection: Comments,
  fragmentName: 'SelectCommentsList',
}

SunshineReportedCommentsItem.propTypes = {
  report: PropTypes.object.isRequired,
  hover: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
  currentUser: PropTypes.object.isRequired,
  editMutation: PropTypes.func.isRequired,
  reportEditMutation: PropTypes.func.isRequired,
};

registerComponent(
  'SunshineReportedCommentsItem',
  SunshineReportedCommentsItem,
  [withEdit, withEditOptions],
  withUser,
  withHover,
  withErrorBoundary
);
