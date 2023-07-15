import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdateComment } from '../hooks/useUpdateComment';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper'
import { commentGetPageUrl } from '../../lib/collections/comments/helpers';
import { useHover } from '../common/withHover'
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser'
import withErrorBoundary from '../common/withErrorBoundary'
import DoneIcon from '@material-ui/icons/Done';
import ClearIcon from '@material-ui/icons/Clear';
import { forumTypeSetting } from '../../lib/instanceSettings';

const SunshineNewCommentsItem = ({comment}: {
  comment: CommentsListWithParentMetadata
}) => {
  const currentUser = useCurrentUser();
  const { hover, anchorEl, eventHandlers } = useHover();
  const updateComment = useUpdateComment('CommentsListWithParentMetadata');
  
  const handleReview = () => {
    void updateComment(comment._id, {
      reviewedByUserId : currentUser!._id
    })
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to immediately delete this comment?")) {
      window.open(userGetProfileUrl(comment.user), '_blank');
      void updateComment(comment._id, {
        deleted: true,
        deletedDate: new Date(),
        deletedByUserId: currentUser!._id,
        deletedReason: "spam"
      })
    }
  }

  return (
    <span {...eventHandlers}>
        <Components.SunshineListItem hover={hover}>
          <Components.SidebarHoverOver hover={hover} anchorEl={anchorEl} >
            <Components.Typography variant="body2">
              <Link to={commentGetPageUrl(comment)}>
                Commented on post: <strong>{ comment.post?.title }</strong>
              </Link>
              <Components.CommentBody comment={comment}/>
            </Components.Typography>
          </Components.SidebarHoverOver>
          <Components.SunshineCommentsItemOverview comment={comment}/>
            {hover && <Components.SidebarActionMenu>
              <Components.SidebarAction title="Mark as Reviewed" onClick={handleReview}>
                <DoneIcon/>
              </Components.SidebarAction>
              <Components.SidebarAction title={`Spam${forumTypeSetting.get() === 'EAForum' ? '' : '/Eugin'} (delete immediately)`} onClick={handleDelete} warningHighlight>
                <ClearIcon/>
              </Components.SidebarAction>
            </Components.SidebarActionMenu>}
        </Components.SunshineListItem>
    </span>
  )
}

const SunshineNewCommentsItemComponent = registerComponent('SunshineNewCommentsItem', SunshineNewCommentsItem, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    SunshineNewCommentsItem: typeof SunshineNewCommentsItemComponent
  }
}
