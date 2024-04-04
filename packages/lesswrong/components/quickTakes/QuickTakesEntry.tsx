import React, { MouseEvent, useState, useCallback, useRef, useEffect } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { EditorChangeEvent, styles as editorStyles, getInitialEditorContents } from "../editor/Editor";
import { styles as buttonStyles } from "../form-components/FormSubmit";
import { styles as submitButtonStyles } from "../posts/PostSubmit";
import { useQuickTakesTags } from "./useQuickTakesTags";
import { useCreate } from "../../lib/crud/withCreate";
import type { Editor as EditorType }  from "../editor/Editor";
import type {
  CommentCancelCallback,
  CommentSuccessCallback,
} from "../comments/CommentsNewForm";
import Button from "@material-ui/core/Button";
import classNames from "classnames";
import { isFriendlyUI } from "../../themes/forumTheme";

const getBorderRadius = (theme: ThemeType) => isFriendlyUI ? theme.borderRadius.default : theme.borderRadius.small;

const styles = (theme: ThemeType) => ({
  ...editorStyles(theme),
  ...buttonStyles(theme),
  root: {
    background: theme.palette.panelBackground.default,
    borderRadius: getBorderRadius(theme),
    fontFamily: theme.palette.fonts.sansSerifStack,
    border: `1px solid ${theme.palette.grey[200]}`,
  },
  commentEditor: {
    "& .ck-placeholder::before": {
      color: isFriendlyUI ? theme.palette.grey[600] : undefined,
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 14,
      fontWeight: 500,
    },
  },
  commentEditorBottomButtom: {
    borderRadius: theme.borderRadius.default,
  },
  collapsed: {
    height: isFriendlyUI ? 64 : 60,
    overflow: "hidden",
  },
  ...submitButtonStyles(theme),
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
      height: 40,
      overflow: 'hidden',
      borderRadius: getBorderRadius(theme),
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
});

// TODO: decide on copy for LW
const placeholder = "Share exploratory, draft-stage, rough thoughts...";

const QuickTakesEntry = ({
  currentUser,
  defaultExpanded = false,
  defaultFocus = false,
  submitButtonAtBottom = false,
  className,
  editorClassName,
  tagsClassName,
  buttonClassName,
  successCallback,
  cancelCallback,
  classes,
}: {
  currentUser: UsersCurrent | null,
  defaultExpanded?: boolean,
  defaultFocus?: boolean,
  submitButtonAtBottom?: boolean,
  className?: string,
  editorClassName?: string,
  tagsClassName?: string,
  buttonClassName?: string,
  successCallback?: CommentSuccessCallback,
  cancelCallback?: CommentCancelCallback,
  classes: ClassesType<typeof styles>,
}) => {
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


  const onFocus = useCallback(() => setExpanded(true), []);

  // TODO: The editor is currently pretty messed up if the user has enabled
  // the markdown editor in their user settings, unless we're positioning the
  // submit button at the bottom. For now, we just disable the editor in this
  // case but we probably want to fix this properly in the long run. This is a
  // pretty small percentage of users, so seems ~fine.
  if (currentUser?.markDownPostEditor && !submitButtonAtBottom) {
    return null;
  }

  const {CommentsNewForm} = Components;

  const innerClassName = classNames(classes.commentEditor, {
    [classes.collapsed]: !expanded,
  });

  return <div className={classNames(classes.root, className)}>
    <div className={innerClassName} onFocus={onFocus}>
      <CommentsNewForm
        type='reply'
        prefilledProps={{
          shortform: true,
          shortformFrontpage: frontpage,
          relevantTagIds: selectedTagIds,
        }}
        enableGuidelines={false}
        className={classNames(classes.commentForm, { [classes.commentFormCollapsed]: !expanded })}
        cancelCallback={onCancel}
        successCallback={successCallback}
        overrideHintText={placeholder}
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
