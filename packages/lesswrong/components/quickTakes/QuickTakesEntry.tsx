import React, { useState, useCallback, useRef } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { styles as editorStyles, getInitialEditorContents } from "../editor/Editor";
import { styles as buttonStyles } from "../form-components/FormSubmit";
import { useQuickTakesTags } from "./useQuickTakesTags";
import { useCreate } from "../../lib/crud/withCreate";
import type { Editor as EditorType }  from "../editor/Editor";
import Button from "@material-ui/core/Button";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  ...editorStyles(theme),
  ...buttonStyles(theme),
  root: {
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 12,
  },
  commentEditor: {
    padding: "5px 10px",
    background: theme.palette.grey[100],
    borderTopLeftRadius: theme.borderRadius.default,
    borderTopRightRadius: theme.borderRadius.default,
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
});

const placeholder = "Share exploratory, draft-stage, rough thoughts...";

const QuickTakesEntry = ({
  currentUser,
  defaultExpanded = false,
  submitButtonAtBottom = false,
  className,
  editorClassName,
  buttonClassName,
  classes,
}: {
  currentUser: UsersCurrent | null,
  defaultExpanded?: boolean,
  submitButtonAtBottom?: boolean,
  className?: string,
  editorClassName?: string,
  buttonClassName?: string,
  classes: ClassesType,
}) => {
  const editorType = "ckEditorMarkup";
  const editorRef = useRef<EditorType>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [contents, setContents] = useState(() => getInitialEditorContents(
    undefined,
    null,
    "contents",
    currentUser,
  ));
  const {
    loading,
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

  const onChange = useCallback(({contents}: AnyBecauseTodo) => {
    setContents(contents);
  }, []);

  const onSubmit = useCallback(async () => {
    const contents = await editorRef.current?.submitData();
    await create({
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
  }, [create, frontpage, selectedTagIds]);

  const onFocus = useCallback(() => setExpanded(true), []);

  const {Editor, Loading, TagsChecklist} = Components;
  const submitButton = (
    <div className={classNames(buttonClassName, {
      [classes.editorButtonContainer]: !submitButtonAtBottom,
      [classes.bottomButtonContainer]: submitButtonAtBottom,
    })}>
      <Button
        type="submit"
        className={classNames(classes.formButton, classes.submitButton)}
        onClick={onSubmit}
      >
        Publish
      </Button>
    </div>
  );
  return (
    <div className={classNames(classes.root, className)}>
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
          value={contents}
          onChange={onChange}
          onFocus={onFocus}
          placeholder={placeholder}
          _classes={classes}
        />
      </div>
      {expanded &&
        <>
          {!submitButtonAtBottom && submitButton}
          {loading
            ? <Loading />
            : (
              <div className={classes.tagContainer}>
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
          }
          {submitButtonAtBottom && submitButton}
        </>
      }
    </div>
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
