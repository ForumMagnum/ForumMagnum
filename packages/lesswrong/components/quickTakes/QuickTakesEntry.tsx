import React, { useState, useCallback } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { styles as editorStyles, getInitialEditorContents } from "../editor/Editor";
import { styles as buttonStyles } from "../form-components/FormSubmit";
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
  collapsed: {
    height: 40,
  },
  buttonContainer: {
    background: theme.palette.grey[100],
    borderBottomLeftRadius: theme.borderRadius.default,
    borderBottomRightRadius: theme.borderRadius.default,
    textAlign: "right",
    padding: "0 8px 8px 0",
  },
});

const placeholder = "Share exploratory, draft-stage, rough thoughts...";

const QuickTakesEntry = ({currentUser, classes}: {
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [contents, setContents] = useState(() => getInitialEditorContents(
    undefined,
    null,
    "contents",
    currentUser,
  ));

  const onChange = useCallback((arg: any) => {
    console.log("qwertyuiop", arg);
    void setContents;
  }, []);

  const onSubmit = useCallback(() => {
  }, []);

  const onFocus = useCallback(() => setExpanded(true), []);

  const {Editor} = Components;
  return (
    <div className={classes.root}>
      <div className={classNames(classes.commentEditor, {
          [classes.collapsed]: !expanded,
        })}>
        <Editor
          currentUser={currentUser}
          formType="new"
          collectionName="Comments"
          fieldName="contents"
          initialEditorType="ckEditorMarkup"
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
          <div className={classes.buttonContainer}>
            <Button
              type="submit"
              className={classNames(classes.formButton, classes.submitButton)}
              onClick={onSubmit}
            >
              Publish
            </Button>
          </div>
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
