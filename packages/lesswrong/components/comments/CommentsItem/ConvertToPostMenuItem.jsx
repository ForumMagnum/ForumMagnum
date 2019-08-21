import React, { PureComponent } from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import MenuItem from '@material-ui/core/MenuItem';
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
    return <MenuItem onClick={this.showConvertDialog}>
      Convert to Post
    </MenuItem>
  }
}

registerComponent(
  'ConvertToPostMenuItem', ConvertToPostMenuItem,
  withDialog
);
