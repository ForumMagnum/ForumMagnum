import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Typography from '@material-ui/core/Typography';
import { Components, registerComponent } from 'meteor/vulcan:core';

const NominatePostDialog = ({post, onClose}) => {
  const { CommentsNewForm } = Components;
  return (
    <Dialog open={true}
      onClose={onClose}
      fullWidth maxWidth="sm"
    >
      <DialogContent>
        <Typography variant="display1">
          Nominate "{post.title}" for the 2018 Review
        </Typography>

        <CommentsNewForm
          post={post}
          successCallback={onClose}
          enableGuidelines={false}
          removeFields={['af']}
          prefilledProps={{
            nominatedForReview: "2018"
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

registerComponent('NominatePostDialog', NominatePostDialog);
