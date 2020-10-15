import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withUpdate } from '../../lib/crud/withUpdate';
import React, { Component } from 'react';
import { Comments } from '../../lib/collections/comments';
import { Link } from '../../lib/reactRouterWrapper'
import Typography from '@material-ui/core/Typography';
import { Posts } from '../../lib/collections/posts';
import withHover from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary'
import withUser from '../common/withUser'
import DoneIcon from '@material-ui/icons/Done';
import DeleteIcon from '@material-ui/icons/Delete';

interface ExternalProps {
  report: any,
  updateReport: any,
}
interface SunshineReportedItemProps extends ExternalProps, WithUserProps, WithHoverProps {
  updateComment: any,
  updatePost: any,
}
class SunshineReportedItem extends Component<SunshineReportedItemProps> {
  handleReview = () => {
    const { currentUser, report, updateReport } = this.props
    updateReport({
      selector: {_id: report._id},
      data: {
        closedAt: new Date(),
        claimedUserId: currentUser!._id,
        markedAsSpam: false
      }
    })
  }

  handleDelete = () => {
    const {
      currentUser,
      report,
      updateComment,
      updatePost,
      updateReport,
    } = this.props
    if (confirm(`Are you sure you want to immediately delete this ${report.comment ? "comment" : "post"}?`)) {
      if (report.comment) {
        updateComment({
          selector: {_id: report.comment._id},
          data: {
            deleted: true,
            deletedDate: new Date(),
            deletedByUserId: currentUser!._id,
            deletedReason: "spam"
          }
        })
      } else if (report.post) {
        updatePost({
          selector: {_id: report.post._id},
          data: { status: report.reportedAsSpam ? 4 : 5 }
        })
      }
      updateReport({
        selector: {_id: report._id},
        data: {
          closedAt: new Date(),
          claimedUserId: currentUser!._id,
          markedAsSpam: report.reportedAsSpam
        }
      })
    }
  }

  render () {
    const { report, hover, anchorEl } = this.props
    const comment = report.comment
    const post = report.post
    const { MetaInfo, SunshineListItem, SidebarInfo, SidebarHoverOver, CommentBody, PostsHighlight, SidebarActionMenu, SidebarAction, FormatDate, SunshineCommentsItemOverview  } = Components

    if (!post) return null;

    return (
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl} >
          <Typography variant="body2">
            <Link to={Posts.getPageUrl(post) + (comment ? ("#" + comment._id) : (""))}>
              Post: <strong>{ post.title }</strong>
            </Link>
            {comment && <div>
              <MetaInfo>Comment:</MetaInfo>
              <div><CommentBody comment={comment}/></div>
            </div>}
            {!comment && <PostsHighlight post={post}/>}
          </Typography>
        </SidebarHoverOver>
        {comment && <SunshineCommentsItemOverview comment={comment}/>}
        <SidebarInfo>
          {!comment && <React.Fragment><strong>{ post.title }</strong> <br/></React.Fragment>}
          <em>"{ report.description }"</em> – {report.user && report.user.displayName}, <FormatDate date={report.createdAt}/>
        </SidebarInfo>
        {hover && <SidebarActionMenu>
          <SidebarAction title="Mark as Reviewed" onClick={this.handleReview}>
            <DoneIcon/>
          </SidebarAction>
          <SidebarAction title="Spam (delete immediately)" onClick={this.handleDelete} warningHighlight>
            <DeleteIcon/>
          </SidebarAction>
        </SidebarActionMenu>
        }
      </SunshineListItem>
    )
  }
}

const SunshineReportedItemComponent = registerComponent<ExternalProps>('SunshineReportedItem', SunshineReportedItem, {
  hocs: [
    withUpdate({
      collection: Comments,
      fragmentName: 'CommentsListWithParentMetadata',
    }),
    withUpdate({
      collection: Posts,
      fragmentName: 'PostsList',
    }),
    withUser,
    withHover(),
    withErrorBoundary
  ]
});

declare global {
  interface ComponentTypes {
    SunshineReportedItem: typeof SunshineReportedItemComponent
  }
}

