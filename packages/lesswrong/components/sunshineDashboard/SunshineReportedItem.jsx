import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments } from '../../lib/collections/comments';
import { Link } from 'react-router'
import Typography from '@material-ui/core/Typography';
import { Posts } from '../../lib/collections/posts';
import withHover from '../common/withHover'
import PropTypes from 'prop-types'
import withErrorBoundary from '../common/withErrorBoundary'
import withUser from '../common/withUser'

class SunshineReportedItem extends Component {

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
      updateComment,
      updatePost,
      reportEditMutation,
    } = this.props
    if (confirm(`Are you sure you want to immediately delete this ${report.comment ? "comment" : "post"}?`)) {
      if (report.comment) {
        updateComment({
          documentId: report.comment._id,
          set: {
            deleted: true,
            deletedDate: new Date(),
            deletedByUserId: currentUser._id,
            deletedReason: "spam"
          },
          unset: {}
        })
      } else if (report.post) {
        updatePost({
          documentId: report.post._id,
          set: {
            deleted: true,
            deletedDate: new Date(),
            deletedByUserId: currentUser._id,
            deletedReason: "spam"
          },
          unset: {}
        })
      }
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
    const post = report.post

    return (
          <Components.SunshineListItem hover={hover}>
            <Components.SidebarHoverOver hover={hover} anchorEl={anchorEl} >
              <Typography variant="body2">
                <Link to={Posts.getPageUrl(post) + (comment ? ("#" + comment._id) : (""))}>
                  Post: <strong>{ post.title }</strong>
                </Link>
                {comment && <Components.CommentBody comment={comment}/>}
                {post && !comment && <Components.PostsHighlight post={post}/>}
              </Typography>
            </Components.SidebarHoverOver>
            {comment && <Components.SunshineCommentsItemOverview comment={comment}/>}
            <Components.SidebarInfo>
              {post && !comment && <React.Fragment><strong>{ post.title }</strong> <br/></React.Fragment>}
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

const withCommentUpdateOptions = {
  collection: Comments,
  fragmentName: 'SelectCommentsList',
}

const withPostUpdateOptions = {
  collection: Posts,
  fragmentName: 'PostsList',
}

SunshineReportedItem.propTypes = {
  report: PropTypes.object.isRequired,
  hover: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
  currentUser: PropTypes.object.isRequired,
  updateComment: PropTypes.func.isRequired,
  updatePost: PropTypes.func.isRequired,
  reportEditMutation: PropTypes.func.isRequired,
};

registerComponent(
  'SunshineReportedItem',
  SunshineReportedItem,
  [withUpdate, withCommentUpdateOptions],
  [withUpdate, withPostUpdateOptions],
  withUser,
  withHover,
  withErrorBoundary
);
