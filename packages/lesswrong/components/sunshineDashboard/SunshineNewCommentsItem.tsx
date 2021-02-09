import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withUpdate } from '../../lib/crud/withUpdate';
import React, { Component } from 'react';
import { Link } from '../../lib/reactRouterWrapper'
import { commentGetPageUrl } from '../../lib/collections/comments/helpers';
import withHover from '../common/withHover'
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import withUser from '../common/withUser'
import withErrorBoundary from '../common/withErrorBoundary'
import DoneIcon from '@material-ui/icons/Done';
import ClearIcon from '@material-ui/icons/Clear';

interface ExternalProps {
  comment: CommentsListWithParentMetadata,
}
interface SunshineNewCommentsItemProps extends ExternalProps, WithUserProps, WithHoverProps {
  updateComment: any,
}

class SunshineNewCommentsItem extends Component<SunshineNewCommentsItemProps> {
  handleReview = () => {
    const { currentUser, comment, updateComment } = this.props
    updateComment({
      selector: {_id: comment._id},
      data: {reviewedByUserId : currentUser!._id}
    })
  }

  handleDelete = () => {
    const { currentUser, comment, updateComment } = this.props
    if (confirm("Are you sure you want to immediately delete this comment?")) {
      window.open(userGetProfileUrl(comment.user), '_blank');
      updateComment({
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

  render () {
    const { comment, hover, anchorEl } = this.props
    return (
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
              <Components.SidebarAction title="Mark as Reviewed" onClick={this.handleReview}>
                <DoneIcon/>
              </Components.SidebarAction>
              <Components.SidebarAction title="Spam (delete immediately)" onClick={this.handleDelete} warningHighlight>
                <ClearIcon/>
              </Components.SidebarAction>
            </Components.SidebarActionMenu>}
        </Components.SunshineListItem>
    )
  }
}

const SunshineNewCommentsItemComponent = registerComponent<ExternalProps>('SunshineNewCommentsItem', SunshineNewCommentsItem, {
  hocs: [
    withUpdate({
      collectionName: 'Comments',
      fragmentName: 'CommentsListWithParentMetadata',
    }),
    withUser, withHover(), withErrorBoundary
  ]
});

declare global {
  interface ComponentTypes {
    SunshineNewCommentsItem: typeof SunshineNewCommentsItemComponent
  }
}
