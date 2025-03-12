import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import Paper from "@/lib/vendor/@material-ui/core/src/Card"
import CloseIcon from '@material-ui/icons/Close';
import type { CommentsNewFormProps } from './CommentsNewForm';

const styles = (theme: ThemeType) => ({
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
    paddingTop: 8,
    paddingBottom: 8,
    position: "relative"
  },
  editor: {
    padding: 20,
    paddingBottom: 12,
  },
});

/**
 * PopupCommentEditor: A floating comment editor. Used when you click the
 * comment button on a selected-text toolbar, and for writing reviews in the
 * LW yearly review. Provides styling, and should be combined with a wrapper
 * like `ReplyCommentDialog` and created with `openDialog`.
 *
 * title: Shown in a title-bar above the comment editor
 * guidelines: (Optional) Shown above the comment editor, below the titlebar,
 *   styled as part of the window content.
 * commentFormProps: Passed through to CommentsNewForm. Used for things like
 *   specifying what post the comment is on, and prefilling props.
 * onClose: Called when the window is closed.
 */
const PopupCommentEditor = ({title, guidelines, commentFormProps, onClose, classes}: {
  title: React.ReactNode,
  guidelines?: React.ReactNode,
  commentFormProps: Partial<CommentsNewFormProps>,
  onClose: () => void,
  classes: ClassesType<typeof styles>
}) => {
  const { CommentsNewForm } = Components;

  return <Paper className={classes.root}>
    <div className={classes.header}>
      <div className={classes.title}>
        {title}
      </div>
      <CloseIcon className={classes.close} onClick={onClose}/>
      {guidelines}
    </div>
    <div className={classes.editor}>
      <CommentsNewForm
        enableGuidelines={false}
        padding={false}
        successCallback={onClose}
        type="comment"
        formProps={{
          maxHeight: true
        }}
        {...commentFormProps}
      />
    </div>
  </Paper>
}

const PopupCommentEditorComponent = registerComponent('PopupCommentEditor', PopupCommentEditor, {styles});

declare global {
  interface ComponentTypes {
    PopupCommentEditor: typeof PopupCommentEditorComponent
  }
}
