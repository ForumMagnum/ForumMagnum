import { Components, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments } from 'meteor/example-forum';
import { Link } from 'react-router'
import moment from 'moment';
import Typography from '@material-ui/core/Typography';
import { Posts } from 'meteor/example-forum';
import withHover from '../common/withHover'
import Popper from '@material-ui/core/Popper';

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

    if (report) {
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
              <Components.SidebarInfo>
                <em>"{ report.description }"</em> – {report.user.displayName}, { moment(new Date(report.createdAt)).fromNow() }
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
  withCurrentUser,
  withHover
);
