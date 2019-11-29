import React, { useState } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Paper from "@material-ui/core/Card"
import CloseIcon from '@material-ui/icons/Close';

const styles = (theme) => ({
  root: {
    background: "white",
    width: 600,
    position: "fixed",
    right: theme.spacing.unit,
    bottom: theme.spacing.unit,
    zIndex: theme.zIndexes.commentBoxPopup,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      right: 0,
      bottom: 0,
    }
  },
  reviewing: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    fontSize: ".9rem"
  },
  title: {
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontWeight: 600,
    marginTop: 4,
  },
  close: {
    position: "absolute",
    right: 8,
    top: 10,
    cursor: "pointer",
    color: theme.palette.grey[400],
    height: 20,
    '&:hover': {
      color: theme.palette.grey[600],
    }
  },
  header: {
    backgroundColor: theme.palette.grey[100],
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 14,
    paddingBottom: 8,
    position: "relative"
  },
  editor:{
    padding: 20,
    paddingBottom: 5,
  },
  guidelines: {
    cursor: "default",
    marginTop: theme.spacing.unit,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    fontSize: "1rem",
    marginBottom: theme.spacing.unit,
    '& ul': {
      marginTop: 5,
      marginBottom: 5,
      paddingInlineStart: "30px"
    },
    '& li': {
      marginTop: 5,
      marginBottom: 5
    },
  },
  hidePrompt: {
    position: "absolute",
    right: 10,
    bottom: 10
  }
})

const ReviewPostForm = ({classes, post, onClose}) => {
  const { CommentsNewForm } = Components 
  const [ showPrompt, setShowPrompt ] = useState(true)

  return <Paper className={classes.root}>
    <div className={classes.header}>
      {/* <div className={classes.reviewing}>
        Reviewing
      </div> */}
      <div className={classes.title}>
        Reviewing "{post.title}"
      </div>
      <CloseIcon className={classes.close} onClick={onClose}/>
      <div className={classes.guidelines}>
        {showPrompt && <div>
          Reviews should ideally answer:
          <ul>
            <li>Is this post epistemically sound?
              <ul>
                <li>Does it make accurate claims? Does it carve reality at the joints?</li>
              </ul>
            </li>
            <li>
              How has this post proved valuable? (be as comprehensive as possible)
            </li>
            <li>
              Should this be included in the <em>Best of LessWrong 2018</em>? Why or why not?
            </li>
            <li>
              How could this post be improved?
            </li>
            <li>
              What followup work would you like to see building on this post?
            </li>
          </ul>
          <a className={classes.hidePrompt} onClick={() => setShowPrompt(false)}>(hide)</a>
        </div>}
        {!showPrompt && <div onClick={() => setShowPrompt(true)}>Reviews should ideally answer... <a onClick={() => setShowPrompt(false)}>(read more)</a></div>}
      </div>
    </div>
    <div className={classes.editor}>
      <CommentsNewForm
        post={post}
        padding={false}
        successCallback={onClose}
        enableGuidelines={false}
        removeFields={['af']}
        type="comment"
        formProps={{
          maxHeight: true
        }}
        prefilledProps={{
          reviewingForReview: "2018"
        }}
      />
    </div>
  </Paper>
}

registerComponent('ReviewPostForm', ReviewPostForm, withStyles(styles, {name:"ReviewPostForm"}));
