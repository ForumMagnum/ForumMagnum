import React, { useState, useEffect } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { generateTokenRequest } from "../../lib/ckEditorUtils";
import { styles as editorStyles, getInitialEditorContents } from "../editor/Editor";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  ...editorStyles(theme),
  root: {
    background: theme.palette.panelBackground.default,
    borderRadius: theme.borderRadius.default,
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 12,
  },
  commentEditor: {
    padding: "5px 10px",
    background: theme.palette.grey[100],
    borderRadius: theme.borderRadius.default,
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
});

const placeholder = "Share exploratory, draft-stage, rough thoughts...";

const QuickTakesEntry = ({currentUser, classes}: {
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  const [expanded, setExpanded] = useState(false);

  // const onExpand = useCallback(() => setExpanded(true), []);
  // const onSuccess = useCallback(() => {}, []);
  // const onCancel = useCallback(() => {}, []);
  // const onBlur = useCallback(() => setExpanded(false), []);
  // const onPublish = useCallback((event) => {
    // event.preventDefault();
  // }, [currentUser]);
  useEffect(() => {
    void generateTokenRequest("Comments", "contents")();
  }, []);

  const [contents, setContents] = useState(() => getInitialEditorContents(
    undefined, null, "contents", currentUser
  ));

  const onChange = (arg: any) => {
    console.log("qwertyuiop", arg);
    void setContents;
  }

  const onFocus = () => setExpanded(true);

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
