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
    padding: 12,
    border: `1px solid ${theme.palette.grey[200]}`,
  },
  commentEditor: {
    padding: "1px 10px",
    background: theme.palette.grey[100],
    borderTopLeftRadius: getBorderRadius(theme),
    borderTopRightRadius: getBorderRadius(theme),
    "& .ck-placeholder::before": {
      color: theme.palette.grey[600],
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 14,
      fontWeight: 500,
    },
  },
  commentEditorBottomButtom: {
    borderRadius: theme.borderRadius.default,
  },
  collapsed: {
    height: 40,
    overflow: "hidden",
    borderBottomLeftRadius: getBorderRadius(theme),
    borderBottomRightRadius: getBorderRadius(theme),
  },
  editorButtonContainer: {
    background: theme.palette.grey[100],
    borderBottomLeftRadius: theme.borderRadius.default,
    borderBottomRightRadius: theme.borderRadius.default,
    textAlign: "right",
    padding: "0 8px 8px 0",
  },
  bottomButtonContainer: {
    textAlign: "right",
    marginTop: 8,
  },
  tagContainer: {
    display: "flex",
    flexWrap: "wrap",
    rowGap: "4px",
    alignItems: "center",
    marginTop: 16,
  },
  tagLabel: {
    fontWeight: 600,
    fontSize: 13,
    marginRight: 8,
  },
  ...submitButtonStyles(theme),
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
  const editorType = "ckEditorMarkup";
  const editorRef = useRef<EditorType>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [contents, setContents] = useState(() => getInitialEditorContents(
    undefined,
    null,
    "contents",
    currentUser,
  ));
  const {
    loading: loadingTags,
    frontpage,
    selectedTagIds,
    tags,
    frontpageTagId,
    onTagSelected,
    onTagRemoved,
  } = useQuickTakesTags();
  const {create} = useCreate({
    collectionName: "Comments",
    fragmentName: "ShortformComments",
  });

  const onChange = useCallback(({contents}: EditorChangeEvent) => {
    setContents(contents);
  }, []);

  const lastSubmittedAt = useRef(0);

  const onSubmit = useCallback(async (ev?: MouseEvent) => {
    ev?.preventDefault();

    // Prevent accidental double submits
    if (Date.now() - lastSubmittedAt.current < 1000) {
      return;
    }
    lastSubmittedAt.current = Date.now();

    setLoadingSubmit(true);
    try {
      const contents = await editorRef.current?.submitData();
      const response = await create({
        data: {
          shortform: true,
          shortformFrontpage: frontpage,
          relevantTagIds: selectedTagIds,
          // There's some magic that makes this work even though it is missing
          // some fields that are marked as required. It hard to work out exactly
          // what's going on without getting lost in the seas of `any`.
          // @ts-ignore
          contents,
        },
      });
      const comment = response.data?.createComment.data;
      void successCallback?.(comment, {form: formRef.current});
      editorRef.current?.clear(currentUser);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      void cancelCallback?.(e);
    }
    setLoadingSubmit(false);
  }, [
    create,
    frontpage,
    selectedTagIds,
    successCallback,
    cancelCallback,
    currentUser,
  ]);

  const onCancel = useCallback(async (ev?: MouseEvent) => {
    ev?.preventDefault();
    editorRef.current?.clear(currentUser);
    setExpanded(false);
    void cancelCallback?.();
  }, [currentUser, cancelCallback]);


  const onFocus = useCallback(() => setExpanded(true), []);

  useEffect(() => {
    const form = formRef.current;
    if (form) {
      const handler = (event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          event.stopPropagation();
          void onSubmit();
        }
      }
      form.addEventListener("keydown", handler, {capture: true});
      return () => form.removeEventListener("keydown", handler);
    }
  }, [formRef, onSubmit]);

  useEffect(() => {
    if (defaultFocus) {
      // Only focus once we've finished rendering
      setTimeout(() => {
        editorRef.current?.focus();
      }, 10);
    }
  }, [defaultFocus, editorRef]);

  // TODO: The editor is currently pretty messed up if the user has enabled
  // the markdown editor in their user settings, unless we're positioning the
  // submit button at the bottom. For now, we just disable the editor in this
  // case but we probably want to fix this properly in the long run. This is a
  // pretty small percentage of users, so seems ~fine.
  if (currentUser?.markDownPostEditor && !submitButtonAtBottom) {
    return null;
  }

  const {Editor, Loading, TagsChecklist} = Components;

  const cancelButton = (
    <Button
      className={classNames("form-cancel", classes.formButton, classes.secondaryButton)}
      onClick={onCancel}
    >
      Cancel
    </Button>
  );

  const submitButton = (
    <Button
      type="submit"
      disabled={loadingSubmit}
      className={classNames(classes.formButton, classes.submitButton)}
      variant={isFriendlyUI ? "contained" : undefined}
      color="primary"
      onClick={onSubmit}
    >
      {loadingSubmit
        ? <Loading />
        : "Publish"
      }
    </Button>
  );

  const submitWrapper = (
    <div className={classNames(buttonClassName, {
      [classes.editorButtonContainer]: !submitButtonAtBottom,
      [classes.bottomButtonContainer]: submitButtonAtBottom,
    })}>
      {!isFriendlyUI && cancelButton}
      {submitButton}
    </div>
  );

  const tagList = (
    loadingTags
      ? <Loading />
      : (
        <div className={classNames(classes.tagContainer, tagsClassName)}>
          <span className={classes.tagLabel}>Set topic</span>
          <TagsChecklist
            tags={tags}
            displaySelected="highlight"
            selectedTagIds={[
              ...(frontpage ? [frontpageTagId] : []),
              ...selectedTagIds,
            ]}
            onTagSelected={onTagSelected}
            onTagRemoved={onTagRemoved}
            tooltips={false}
            truncate
            smallText
          />
        </div>
      )
  );

  return (
    <form
      ref={formRef}
      className={classNames(classes.root, className)}
    >
      <div className={classNames(classes.commentEditor, editorClassName, {
        [classes.commentEditorBottomButtom]: submitButtonAtBottom,
        [classes.collapsed]: !expanded,
      })}>
        <Editor
          ref={editorRef}
          currentUser={currentUser}
          formType="new"
          collectionName="Comments"
          fieldName="contents"
          initialEditorType={editorType}
          isCollaborative={false}
          quickTakesStyles
          commentEditor
          value={contents}
          onChange={onChange}
          onFocus={onFocus}
          placeholder={placeholder}
          _classes={classes}
        />
      </div>
      {expanded &&
        <>
          {!submitButtonAtBottom && submitWrapper}
          {isFriendlyUI && tagList}
          {submitButtonAtBottom && submitWrapper}
        </>
      }
    </form>
  );
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
