import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType) => ({
  popperContent: {
    padding: theme.spacing.unit * 2,
    maxWidth: 400,
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.borderRadius.default,
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing.unit * 2,
  },
});

const ForumEventNewComment = ({ open, anchorEl, onClose, classes }: {
  open: boolean,
  anchorEl: HTMLElement | null,
  onClose: () => void,
  classes: ClassesType,
}) => {
  const { LWPopper, CommentsNewForm } = Components;

  return (
    <LWPopper open={open} anchorEl={anchorEl} placement="bottom-start">
      <div className={classes.popperContent}>
        <div>What made you vote this way?</div>
        <div>Your response will appear as a comment on the Debate week post, and show next to your avatar on this banner.</div>
        <CommentsNewForm
          type='reply'
          enableGuidelines={false}
        />
      </div>
    </LWPopper>
  );
};

const ForumEventNewCommentComponent = registerComponent('ForumEventNewComment', ForumEventNewComment, { styles });

declare global {
  interface ComponentTypes {
    ForumEventNewComment: typeof ForumEventNewCommentComponent
  }
}
