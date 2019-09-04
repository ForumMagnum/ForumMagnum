import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import withDialog from '../../common/withDialog'
import Users from "meteor/vulcan:users";
import { Posts } from '../../../lib/collections/posts';
import { Link } from '../../../lib/reactRouterWrapper.js';
import withUser from '../../common/withUser'

class CreateDraftPostMenuItem extends PureComponent {

  showConvertDialog = () => {
    const { openDialog, comment } = this.props;
    openDialog({
      componentName: "CreateDraftPostDialog",
      componentProps: {
        documentId: comment._id, // we need more data from the comment than is currently available
        comment: comment // at the same time, we need some info (which is available) immediately to avoid UI flicker, and so also pass through the current copy of the comment
      }
    });
  }

  render() {
    const { comment, currentUser } = this.props 

    if (comment.convertedToPostId && !comment.convertedToPost.draft) { return null }
    if (!Users.owns(currentUser, comment) && !Users.canDo(currentUser, 'comments.edit.all')) { return null }

    if (comment.convertedToPostId && comment.convertedToPost.draft) {
      const goToDraftTooltip = <div>
        You have previously created a draft post based on this comment.
      </div>
      return (
        <Link to={Posts.getPageUrl(comment.convertedToPost)}>
          <Tooltip title={goToDraftTooltip}>
            <MenuItem>
              Go to Draft Post
            </MenuItem>
          </Tooltip>
        </Link>
      )
    }

    const tooltip = <div>
      <div>Creates a draft post based on this comment</div>
      <div><em>(intended for comments that you've decided were worth converting into a full post)</em></div>
    </div>
    
    return (
      <Tooltip title={tooltip}>
        <MenuItem onClick={this.showConvertDialog}>
          Create Draft Post
        </MenuItem>
      </Tooltip>
    )
  }
}

registerComponent(
  'CreateDraftPostMenuItem', CreateDraftPostMenuItem,
  withDialog, withUser
);
