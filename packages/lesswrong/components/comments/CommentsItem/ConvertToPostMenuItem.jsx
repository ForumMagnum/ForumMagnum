import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import withDialog from '../../common/withDialog'
import { Posts } from '../../../lib/collections/posts';
import { Link } from '../../../lib/reactRouterWrapper.js';

class ConvertToPostMenuItem extends PureComponent {

  showConvertDialog = () => {
    const { openDialog, comment } = this.props;
    openDialog({
      componentName: "ConvertToPostDialog",
      componentProps: {
        documentId: comment._id,
        defaultMoveChildComments: comment.shortform && !(comment.topLevelCommentId)
      }
    });
  }

  render() {
    const { comment } = this.props 

    if (comment.convertedToPostId && !comment.convertedToPost.draft) { return null }

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
  'ConvertToPostMenuItem', ConvertToPostMenuItem,
  withDialog
);
