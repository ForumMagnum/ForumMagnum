import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdate } from '../../lib/crud/withUpdate';
import { postStatuses } from '../../lib/collections/posts/constants';
import React from 'react';
import { useHover } from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary'
import DoneIcon from '@material-ui/icons/Done';
import DeleteIcon from '@material-ui/icons/Delete';
import { forumTypeSetting } from '../../lib/instanceSettings';
import PersonOutlineIcon from '@material-ui/icons/PersonOutline'
import { Link } from '../../lib/reactRouterWrapper'

const styles = (_theme: ThemeType) => ({
  reportedUser: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: 4
  },
  reportedUserIcon: {
    height: 12,
    width: 12,
  },
});

const SunshineReportedItem = ({report, updateReport, classes, currentUser, refetch}: {
  report: UnclaimedReportsList,
  updateReport: WithUpdateFunction<"Reports">,
  classes: ClassesType<typeof styles>,
  currentUser: UsersCurrent,
  refetch: () => void
}) => {
  const { hover, anchorEl, eventHandlers } = useHover();
  const { mutate: updateComment } = useUpdate({
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
  });
  const { mutate: updatePost } = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });
  
  const handleReview = () => {
    void updateReport({
      selector: {_id: report._id},
      data: {
        closedAt: new Date(),
        claimedUserId: currentUser!._id,
        markedAsSpam: false
      }
    })
  }

  const handleDelete = () => {
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
          data: { status: report.reportedAsSpam
            ? postStatuses.STATUS_SPAM
            : postStatuses.STATUS_DELETED
          }
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

  const {comment, post, reportedUser} = report;
  const {
    SunshineListItem, SidebarInfo, SidebarHoverOver, PostsTitle, PostsHighlight,
    SidebarActionMenu, SidebarAction, FormatDate, CommentsNode, Typography,
    SunshineCommentsItemOverview, SunshineNewUsersInfo, UsersName,
  } = Components;
  return (
    <span {...eventHandlers}>
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl} >
          <Typography variant="body2">
            {comment && <CommentsNode
              treeOptions={{
                condensed: false,
                post: comment.post || undefined,
                tag: comment.tag || undefined,
                showPostTitle: true,
              }}
              comment={comment}
            />}
            {post && !comment && <div>
              <PostsTitle post={post}/>
              <PostsHighlight post={post} maxLengthWords={600}/>
            </div>}
            {reportedUser && <SunshineNewUsersInfo user={reportedUser} currentUser={currentUser} refetch={refetch}/>}
          </Typography>
        </SidebarHoverOver>
        {comment && <SunshineCommentsItemOverview comment={comment}/>}
        <SidebarInfo>
          {(post && !comment) && <>
            <strong>{ post?.title }</strong>
            <br/>
          </>}
          {reportedUser && <div>
            <Link to={report.link} className={classes.reportedUser}>
              <strong><UsersName user={reportedUser} /></strong>
              <PersonOutlineIcon className={classes.reportedUserIcon}/>
            </Link>
          </div>}
          <em>"{ report.description }"</em> – <UsersName user={report.user} />, <FormatDate date={report.createdAt}/>
        </SidebarInfo>
        {hover && <SidebarActionMenu>
          <SidebarAction title="Mark as Reviewed" onClick={handleReview}>
            <DoneIcon/>
          </SidebarAction>
          {(post || comment) && <SidebarAction title={`Spam${forumTypeSetting.get() === 'EAForum' ? '' : '/Eugin'} (delete immediately)`} onClick={handleDelete} warningHighlight>
            <DeleteIcon/>
          </SidebarAction>}
        </SidebarActionMenu>
        }
      </SunshineListItem>
    </span>
  );
}

const SunshineReportedItemComponent = registerComponent('SunshineReportedItem', SunshineReportedItem, {
  styles, hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    SunshineReportedItem: typeof SunshineReportedItemComponent
  }
}
