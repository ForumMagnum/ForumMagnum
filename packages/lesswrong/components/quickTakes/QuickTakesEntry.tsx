import React, { MouseEvent, useState, useCallback, useRef, useEffect } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useQuickTakesTags } from "./useQuickTakesTags";
import {
  COMMENTS_NEW_FORM_PADDING,
  CommentCancelCallback,
  CommentSuccessCallback,
} from "../comments/CommentsNewForm";
import classNames from "classnames";
import { isFriendlyUI } from "../../themes/forumTheme";
import { useDialog } from "../common/withDialog";
import { useLoginPopoverContext } from "../hooks/useLoginPopoverContext";

const COLLAPSED_HEIGHT = 40;

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.quickTakesEntry,
    fontFamily: theme.palette.fonts.sansSerifStack,
    border: `1px solid ${theme.palette.grey[200]}`,
  },
  commentEditor: {
    "& .ck-placeholder": {
      marginTop: isFriendlyUI ? "-3px !important" : undefined,
      "&::before": {
        color: isFriendlyUI ? theme.palette.grey[600] : undefined,
        fontFamily: theme.palette.fonts.sansSerifStack,
        fontSize: 14,
        fontWeight: 500,
      },
    },
  },
  collapsed: {
    height: COLLAPSED_HEIGHT + (2 * COMMENTS_NEW_FORM_PADDING),
    overflow: "hidden",
  },
  commentForm: {
    '& .form-input': {
      margin: 0,
      minHeight: 30,
    },
    '& .ck.ck-editor__editable_inline': {
      border: "none !important",
    },
    '& .EditorTypeSelect-select': {
      display: 'none',
    },
  },
  commentFormCollapsed: {
    '& .form-input': {
      height: COLLAPSED_HEIGHT,
      overflow: 'hidden',
      borderRadius: theme.borderRadius.quickTakesEntry,
    },
    '& .EditorFormComponent-commentEditorHeight': {
      minHeight: 'unset'
    },
    '& .EditorFormComponent-commentEditorHeight .ck.ck-content': {
      minHeight: 'unset'
    },
    '& .LocalStorageCheck-root': {
      display: 'none',
    },
    '& .ck .ck-placeholder': {
      position: 'unset'
    },
    '& .CommentsNewForm-submitQuickTakes': {
      display: 'none'
    }
  },
  userNotApprovedMessage: {
    background: 'none',
    border: 'none',
    padding: '10px 10px 0 10px',
    fontSize: 14,
    color: theme.palette.grey[600],
    fontStyle: 'italic',
  },
  ghibliCreatureContainer: {
    display: 'none',
    ...(theme.themeOptions.name === 'ghiblify' && {
      display: 'block',
    }),
    position: 'absolute',
    top: '-205px',
    right: '250px',
    width: '200px',
    height: '264px',
    zIndex: 10,
    pointerEvents: 'none',
  },
  ghibliCreature: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    pointerEvents: 'auto',
    transform: 'rotate(1deg)',
    transition: 'transform 0.3s ease-in-out',
    cursor: 'pointer',
    '&:hover': {
      transform: 'rotate(-1deg)',
    },
  },
});

// TODO: decide on copy for LW
const placeholder = "Share exploratory, draft-stage, rough thoughts...";

const QuickTakesEntry = ({
  currentUser,
  defaultExpanded = false,
  defaultFocus = false,
  submitButtonAtBottom = false,
  className,
  successCallback,
  cancelCallback,
  classes,
}: {
  currentUser: UsersCurrent | null,
  defaultExpanded?: boolean,
  defaultFocus?: boolean,
  submitButtonAtBottom?: boolean,
  className?: string,
  successCallback?: CommentSuccessCallback,
  cancelCallback?: CommentCancelCallback,
  classes: ClassesType<typeof styles>,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { openDialog } = useDialog();
  const {onSignup} = useLoginPopoverContext();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const {
    frontpage,
    selectedTagIds,
  } = useQuickTakesTags();

  const onCancel = useCallback(async (ev?: MouseEvent) => {
    ev?.preventDefault();
    setExpanded(false);
    void cancelCallback?.();
  }, [cancelCallback]);

  const onFocus = useCallback(() => {
    if (currentUser) {
      setExpanded(true);
    } else {
      if (isFriendlyUI) {
        onSignup();
      } else {
        openDialog({
          componentName: "LoginPopup",
          componentProps: {}
        });
        setExpanded(true);
      }
    }
  }, [currentUser, openDialog, onSignup]);

  useEffect(() => {
    setTimeout(() => {
      if (defaultFocus && ref.current) {
        const editor = ref.current.querySelector("[contenteditable=\"true\"]");
        (editor as HTMLDivElement | null)?.focus?.();
      }
    }, 0);
    // This should only ever run on the first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TODO: The editor is currently pretty messed up if the user has enabled
  // the markdown editor in their user settings, unless we're positioning the
  // submit button at the bottom. For now, we just disable the editor in this
  // case but we probably want to fix this properly in the long run. This is a
  // pretty small percentage of users, so seems ~fine.
  if (currentUser?.markDownPostEditor && !submitButtonAtBottom) {
    return null;
  }

  // is true when user is logged out or has not been reviewed yet, i.e. has made no contributions yet
  const showNewUserMessage = !currentUser?.reviewedByUserId && !isFriendlyUI;

  const {CommentsNewForm} = Components;
  return <div className={classNames(classes.root, className)} ref={ref}>
    <div className={classes.ghibliCreatureContainer}>
      <img 
        src="https://res.cloudinary.com/lesswrong-2-0/image/upload/f_auto,q_auto,w_150/ghibli_creature_1a_pink_ov86x5.png"
        alt="Ghibli creature" 
        className={classes.ghibliCreature} 
      />
    </div>
    {expanded && showNewUserMessage && <div className={classes.userNotApprovedMessage}>Quick Takes is an excellent place for your first contribution!</div>}
    <div
      className={classNames(classes.commentEditor, {[classes.collapsed]: !expanded})}
      onFocus={onFocus}
    >
      <CommentsNewForm
        key={currentUser?._id ?? "logged-out"}
        type='reply'
        prefilledProps={{
          shortform: true,
          shortformFrontpage: frontpage,
          relevantTagIds: selectedTagIds,
        }}
        enableGuidelines={false}
        className={classNames(classes.commentForm, {
          [classes.commentFormCollapsed]: !expanded,
        })}
        cancelCallback={onCancel}
        successCallback={successCallback}
        overrideHintText={placeholder}
        quickTakesSubmitButtonAtBottom={submitButtonAtBottom}
      />
    </div>
  </div>
}

const QuickTakesEntryComponent = registerComponent(
  "QuickTakesEntry",
  QuickTakesEntry,
  {styles},
);

declare global {
  interface ComponentTypes {
    QuickTakesEntry: typeof QuickTakesEntryComponent
  }
}
