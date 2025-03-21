import React from 'react';
import DialogContent from '@/lib/vendor/@material-ui/core/src/DialogContent';
import DialogTitle from '@/lib/vendor/@material-ui/core/src/DialogTitle';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType) => ({
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
    borderTop: theme.palette.border.slightlyFaint,
    textAlign: "center"
  },
  link: {
    color: theme.palette.primary.main,
    display: "block",
    marginTop: 10
  },
  hintText: {
    '& p': {
      marginTop: 2,
      marginBottom: 2
    }
  }
})


const NominatePostDialog = ({classes, post, onClose}: {
  classes: ClassesType<typeof styles>,
  post: PostsBase,
  onClose?: () => void,
}) => {
  const { CommentsNewForm, Typography, LWDialog } = Components;

  const hintText = <div className={classes.hintText}>
    <p>How has this post been useful to you over the past year or two?</p> 
    <p>Has it influenced your overall thinking, or been useful for particular projects or decisions?</p>
    <p>(The more specific and concrete, the more helpful!)</p>
  </div>

  return (
    <LWDialog open={true}
      onClose={onClose}
      fullWidth maxWidth="sm"
    >
      <DialogTitle>
        <div className={classes.nominating}>Nominating for the 2019 Review:</div>
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
            nominatedForReview: "2019"
          }}
        />
        <Typography variant="body2" className={classes.text}>
          This will appear as a comment on the original post. You can edit it afterwards. 
          <Link 
            className={classes.link}
            target="_blank"
            to={"/posts/QFBEjjAvT6KbaA3dY/the-lesswrong-2019-review"}
          >
            Click here for more information on the 2019 Review
          </Link>
        </Typography>
      </DialogContent>
    </LWDialog>
  );
}

const NominatePostDialogComponent = registerComponent('NominatePostDialog', NominatePostDialog, {styles});

declare global {
  interface ComponentTypes {
    NominatePostDialog: typeof NominatePostDialogComponent
  }
}

