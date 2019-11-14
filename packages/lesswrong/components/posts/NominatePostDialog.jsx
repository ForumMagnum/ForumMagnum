import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import { Components, registerComponent } from 'meteor/vulcan:core';


const NominatePostDialog = ({post, onClose}) => {
  const { CommentsNewForm } = Components;
  return (
    <Dialog open={true}
      onClose={onClose}
      fullWidth maxWidth="sm"
    >
      <DialogContent>
        <CommentsNewForm
          post={post}
          successCallback={onClose}
          prefilledProps={{
            nomination: "2018"
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

registerComponent('NominatePostDialog', NominatePostDialog);
