import { registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdate } from '../../lib/crud/withUpdate';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper'
import { commentGetPageUrl } from '../../lib/collections/comments/helpers';
import { useHover } from '../common/withHover'
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser'
import withErrorBoundary from '../common/withErrorBoundary'
import DoneIcon from '@/lib/vendor/@material-ui/icons/src/Done';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear';
import { isLWorAF } from '../../lib/instanceSettings';
import { SunshineListItem } from "./SunshineListItem";
import { SidebarHoverOver } from "./SidebarHoverOver";
import { Typography } from "../common/Typography";
import { CommentBody } from "../comments/CommentsItem/CommentBody";
import { SunshineCommentsItemOverview } from "./SunshineCommentsItemOverview";
import { SidebarActionMenu } from "./SidebarActionMenu";
import { SidebarAction } from "./SidebarAction";

const SunshineNewCommentsItemInner = ({comment}: {
  comment: CommentsListWithParentMetadata
}) => {
  const currentUser = useCurrentUser();
  const { hover, anchorEl, eventHandlers } = useHover();
  const { mutate: updateComment } = useUpdate({
    collectionName: 'Comments',
    fragmentName: 'CommentsListWithParentMetadata',
  });
  
  const handleReview = () => {
    void updateComment({
      selector: {_id: comment._id},
      data: {reviewedByUserId : currentUser!._id}
    })
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to immediately delete this comment?")) {
      window.open(userGetProfileUrl(comment.user), '_blank');
      void updateComment({
        selector: {_id: comment._id},
        data: {
          deleted: true,
          deletedDate: new Date(),
          deletedByUserId: currentUser!._id,
          deletedReason: "spam"
        }
      })
    }
  }

  return (
    <span {...eventHandlers}>
        <SunshineListItem hover={hover}>
          <SidebarHoverOver hover={hover} anchorEl={anchorEl} >
            <Typography variant="body2">
              <Link to={commentGetPageUrl(comment)}>
                Commented on post: <strong>{ comment.post?.title }</strong>
              </Link>
              <CommentBody comment={comment}/>
            </Typography>
          </SidebarHoverOver>
          <SunshineCommentsItemOverview comment={comment}/>
            {hover && <SidebarActionMenu>
              <SidebarAction title="Mark as Reviewed" onClick={handleReview}>
                <DoneIcon/>
              </SidebarAction>
              <SidebarAction title={`Spam${!isLWorAF ? '' : '/Eugin'} (delete immediately)`} onClick={handleDelete} warningHighlight>
                <ClearIcon/>
              </SidebarAction>
            </SidebarActionMenu>}
        </SunshineListItem>
    </span>
  )
}

export const SunshineNewCommentsItem = registerComponent('SunshineNewCommentsItem', SunshineNewCommentsItemInner, {
  hocs: [withErrorBoundary]
});


