import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  nominating: {
    marginTop: 8,
    fontSize: "1.2rem"
  },
  postTitle: {
    marginTop: 5
  },
  text: {
    marginTop: "1em",
    paddingTop: "1em",
    color: theme.palette.grey[600],
    borderTop: "solid 1px rgba(0,0,0,.15)",
    textAlign: "center"
  }
})


const NominatePostDialog = ({classes, post, onClose}) => {
  const { CommentsNewForm } = Components;

  const hintText = <div>
    <div>How has this post been useful to your over the past year or two?</div> 
    <div>Has it influenced your overall thinking, or been useful for specific projects?</div>
    <div>The more specific and concrete, the more helpful.</div>
  </div>

  return (
    <Dialog open={true}
      onClose={onClose}
      fullWidth maxWidth="sm"
    >
      <DialogTitle>
        <div className={classes.nominating}>Nominating for the 2018 Review:</div>
        <div className={classes.postTitle}>{post.title}</div>
      </DialogTitle>
      <DialogContent>
        <CommentsNewForm
          post={post}
          padding={false}
          successCallback={onClose}
          enableGuidelines={false}
          removeFields={['af']}
          type="comment"
          formProps={{
            editorHintText: hintText
          }}
          prefilledProps={{
            nominatedForReview: "2018"
          }}
        />
          <Typography variant="body2" className={classes.text}>
          This will appear as a comment on the original post. You can edit it afterwards.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}

registerComponent('NominatePostDialog', NominatePostDialog, withStyles(styles, {name:"NominatePostDialog"}));
