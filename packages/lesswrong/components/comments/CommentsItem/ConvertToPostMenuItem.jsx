import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
import Tooltip from '@material-ui/core/Tooltip';
import withDialog from '../../common/withDialog'

class ConvertToPostMenuItem extends PureComponent {

  showConvertDialog = () => {
    const { openDialog, comment } = this.props;
    openDialog({
      componentName: "ConvertToPostDialog",
      componentProps: {
        documentId: comment._id,
        defaultMoveComments: comment.shortform && !comment.topLevelCommentId
      }
    });
  }

  render() {

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
