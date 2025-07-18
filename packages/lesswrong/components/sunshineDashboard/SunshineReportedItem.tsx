import { registerComponent } from '../../lib/vulcan-lib/components';
import { postStatuses } from '../../lib/collections/posts/constants';
import React from 'react';
import { useHover } from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary'
import DoneIcon from '@/lib/vendor/@material-ui/icons/src/Done';
import DeleteIcon from '@/lib/vendor/@material-ui/icons/src/Delete';
import { forumTypeSetting } from '../../lib/instanceSettings';
import PersonOutlineIcon from '@/lib/vendor/@material-ui/icons/src/PersonOutline'
import { Link } from '../../lib/reactRouterWrapper'
import SunshineListItem from "./SunshineListItem";
import SidebarInfo from "./SidebarInfo";
import SidebarHoverOver from "./SidebarHoverOver";
import PostsTitle from "../posts/PostsTitle";
import PostsHighlight from "../posts/PostsHighlight";
import SidebarActionMenu from "./SidebarActionMenu";
import SidebarAction from "./SidebarAction";
import FormatDate from "../common/FormatDate";
import CommentsNodeInner from "../comments/CommentsNode";
import { Typography } from "../common/Typography";
import SunshineCommentsItemOverview from "./SunshineCommentsItemOverview";
import SunshineNewUsersInfo from "./SunshineNewUsersInfo";
import UsersName from "../users/UsersName";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const PostsListUpdateMutation = gql(`
  mutation updatePostSunshineReportedItem1($selector: SelectorInput!, $data: UpdatePostDataInput!) {
    updatePost(selector: $selector, data: $data) {
      data {
        ...PostsList
      }
    }
  }
`);

const CommentsListWithParentMetadataUpdateMutation = gql(`
  mutation updateCommentSunshineReportedItem($selector: SelectorInput!, $data: UpdateCommentDataInput!) {
    updateComment(selector: $selector, data: $data) {
      data {
        ...CommentsListWithParentMetadata
      }
    }
  }
`);

const UnclaimedReportsListUpdateMutation = gql(`
  mutation updateReportSunshineReportedContentList($selector: SelectorInput!, $data: UpdateReportDataInput!) {
    updateReport(selector: $selector, data: $data) {
      data {
        ...UnclaimedReportsList
      }
    }
  }
`);

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

const SunshineReportedItem = ({report, classes, currentUser, refetch}: {
  report: UnclaimedReportsList,
  classes: ClassesType<typeof styles>,
  currentUser: UsersCurrent,
  refetch: () => void
}) => {
  const { hover, anchorEl, eventHandlers } = useHover();
  const [updateReport] = useMutation(UnclaimedReportsListUpdateMutation);
  const [updateComment] = useMutation(CommentsListWithParentMetadataUpdateMutation);
  const [updatePost] = useMutation(PostsListUpdateMutation);
  
  const handleReview = () => {
    void updateReport({
      variables: {
        selector: {_id: report._id},
        data: {
          closedAt: new Date(),
          claimedUserId: currentUser!._id,
          markedAsSpam: false
        }
      }
    });
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to immediately delete this ${report.comment ? "comment" : "post"}?`)) {
      if (report.comment) {
        void updateComment({
          variables: {
            selector: { _id: report.comment._id },
            data: {
              deleted: true,
              deletedDate: new Date(),
              deletedByUserId: currentUser!._id,
              deletedReason: "spam"
            }
          }
        })
      } else if (report.post) {
        void updatePost({
          variables: {
            selector: { _id: report.post._id },
            data: {
              status: report.reportedAsSpam
                ? postStatuses.STATUS_SPAM
                : postStatuses.STATUS_DELETED
            }
          }
        })
      }
      void updateReport({
        variables: {
          selector: {_id: report._id},
          data: {
            closedAt: new Date(),
            claimedUserId: currentUser!._id,
            markedAsSpam: report.reportedAsSpam
          }
        }
      });
    }
  }

  const {comment, post, reportedUser} = report;
  return (
    <span {...eventHandlers}>
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl} >
          <Typography variant="body2">
            {comment && <CommentsNodeInner
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
              <strong><UsersName user={reportedUser} simple={true} /></strong>
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

export default registerComponent('SunshineReportedItem', SunshineReportedItem, {
  styles, hocs: [withErrorBoundary]
});


