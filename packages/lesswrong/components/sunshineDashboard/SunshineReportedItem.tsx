import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withUpdate } from '../../lib/crud/withUpdate';
import React, { Component } from 'react';
import { Link } from '../../lib/reactRouterWrapper'
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import withHover from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary'
import withUser from '../common/withUser'
import DoneIcon from '@material-ui/icons/Done';
import DeleteIcon from '@material-ui/icons/Delete';

interface ExternalProps {
  report: any,
  updateReport: WithUpdateFunction<ReportsCollection>,
}
interface SunshineReportedItemProps extends ExternalProps, WithUserProps, WithHoverProps {
  updateComment: WithUpdateFunction<CommentsCollection>,
  updatePost: WithUpdateFunction<PostsCollection>,
}
class SunshineReportedItem extends Component<SunshineReportedItemProps> {
  handleReview = () => {
    const { currentUser, report, updateReport } = this.props
    void updateReport({
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
        void updateComment({
          selector: {_id: report.comment._id},
          data: {
            deleted: true,
            deletedDate: new Date(),
            deletedByUserId: currentUser!._id,
            deletedReason: "spam"
          }
        })
      } else if (report.post) {
        void updatePost({
          selector: {_id: report.post._id},
          data: { status: report.reportedAsSpam ? 4 : 5 }
        })
      }
      void updateReport({
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
    const { MetaInfo, SunshineListItem, SidebarInfo, SidebarHoverOver, CommentBody, PostsHighlight, SidebarActionMenu, SidebarAction, FormatDate, SunshineCommentsItemOverview, Typography } = Components

    if (!post) return null;

    return (
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl} >
          <Typography variant="body2">
            <Link to={postGetPageUrl(post) + (comment ? ("#" + comment._id) : (""))}>
              Post: <strong>{ post.title }</strong>
            </Link>
            {comment && <div>
              <MetaInfo>Comment:</MetaInfo>
              <div><CommentBody comment={comment}/></div>
            </div>}
            {!comment && <PostsHighlight post={post} maxLengthWords={600}/>}
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
      collectionName: "Comments",
      fragmentName: 'CommentsListWithParentMetadata',
    }),
    withUpdate({
      collectionName: "Posts",
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

