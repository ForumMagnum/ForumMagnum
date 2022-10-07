import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import Paper from "@material-ui/core/Card"
import CloseIcon from '@material-ui/icons/Close';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { REVIEW_YEAR } from '../../lib/reviewUtils';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.panelBackground.default,
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
    paddingBottom: 12,
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
    right: 14,
    bottom: 14
  },
  moderatorsNote: {
    fontStyle: "italic",
    marginTop: theme.spacing.unit,
  }
})

const ReviewPostForm = ({classes, post, onClose}: {
  classes: ClassesType,
  post: PostsBase,
  onClose: ()=>void,
}) => {
  const { CommentsNewForm } = Components 
  const [ showPrompt, setShowPrompt ] = useState(true)

  return <Paper className={classes.root}>
    <div className={classes.header}>
      <div className={classes.title}>
        Reviewing "<Link to={postGetPageUrl(post)}>{post.title}</Link>"
      </div>
      <CloseIcon className={classes.close} onClick={onClose}/>
      <div className={classes.guidelines}>
        {showPrompt && <div>
          Reviews should provide information that help evaluate a post 
          <ul>
            <li>What does this post add to the conversation?</li>
            <li>How did this post affect you, your thinking, and your actions?</li>
            <li>Does it make accurate claims? Does it carve reality at the joints? How do you know?</li>
            <li>Is there a subclaim of this post that you can test?</li>
            <li>What followup work would you like to see building on this post?</li>
          </ul>
          <div className={classes.moderatorsNote}>Moderators may promote comprehensive reviews to top-level posts.</div>
          <a className={classes.hidePrompt} onClick={() => setShowPrompt(false)}>(click to hide)</a>
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
          reviewingForReview: REVIEW_YEAR.toString()
        }}
      />
    </div>
  </Paper>
}

const ReviewPostFormComponent = registerComponent('ReviewPostForm', ReviewPostForm, {styles});

declare global {
  interface ComponentTypes {
    ReviewPostForm: typeof ReviewPostFormComponent
  }
}
