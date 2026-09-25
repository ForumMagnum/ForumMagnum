import React, { useEffect, useMemo, useState } from "react";
import Input from "@/lib/vendor/@material-ui/core/src/Input";
import AutoSavedEditorField from "../editor/AutoSavedEditorField";
import { defineStyles, useStyles } from "../hooks/useStyles";
import ForumIcon from "../common/ForumIcon";
import LWTooltip from "../common/LWTooltip";
import SequenceEditMenu from "./SequenceEditMenu";
import type { ChapterDescription, EditableChapter } from "./sequenceStructure";
import { blurOnEnter } from "./blurOnEnter";

const styles = defineStyles("SequenceEditChapter", (theme: ThemeType) => ({
  root: {
    marginTop: 28,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  titleInput: {
    fontFamily: "inherit",
    flexGrow: 1,
    minWidth: 0,
    margin: "0 -4px",
    padding: "2px 4px",
    borderRadius: 4,
    color: "inherit",
    "&:hover": {
      background: theme.palette.greyAlpha(0.04),
    },
    "&:focus-within": {
      background: theme.palette.greyAlpha(0.06),
    },
    "& input": {
      ...theme.typography.chapterTitle,
      ...theme.typography.largeChapterTitle,
      fontFamily: "inherit",
      margin: 0,
    },
  },
  description: {
    marginTop: 8,
  },
  deleteButton: {
    display: "flex",
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: 4,
    borderRadius: 4,
    color: theme.palette.greyAlpha(0.4),
    "&:hover:enabled": {
      color: theme.palette.greyAlpha(0.85),
      background: theme.palette.greyAlpha(0.05),
    },
    "&:disabled": {
      opacity: 0.4,
      cursor: "default",
    },
  },
  deleteIcon: {
    width: 16,
    height: 16,
  },
  posts: {
    marginTop: 8,
  },
}));

/**
 * One chapter in the sequence editor: its title, description, menu and delete
 * button, then its posts (passed as children). The title saves when it loses
 * focus or Enter is pressed; the description saves when it loses focus.
 */
const SequenceEditChapter = ({
  chapter,
  canMoveUp,
  canMoveDown,
  canDelete,
  isOnlyChapter,
  autoFocusTitle,
  onTitleChange,
  onDescriptionCommit,
  onMove,
  onDelete,
  children,
}: {
  chapter: EditableChapter,
  canMoveUp: boolean,
  canMoveDown: boolean,
  canDelete: boolean,
  isOnlyChapter: boolean,
  autoFocusTitle: boolean,
  onTitleChange: (title: string) => void,
  onDescriptionCommit: (description: ChapterDescription) => Promise<boolean>,
  onMove: (direction: "up" | "down") => void,
  onDelete: () => void,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const [title, setTitle] = useState(chapter.title ?? "");
  useEffect(() => setTitle(chapter.title ?? ""), [chapter.title]);
  const descriptionDocument = useMemo(
    () => ({ _id: chapter._id, contents: chapter.description }),
    [chapter._id, chapter.description],
  );

  const deleteTooltip = canDelete
    ? (isOnlyChapter ? "Remove chapter (keeps its posts)" : "Delete chapter")
    : "Move or remove this chapter's posts first";

  return <div className={classes.root}>
    <div className={classes.header}>
      <Input
        className={classes.titleInput}
        value={title}
        placeholder="Chapter title"
        autoFocus={autoFocusTitle}
        disableUnderline
        onChange={(event) => setTitle(event.target.value)}
        onBlur={() => onTitleChange(title)}
        onKeyDown={blurOnEnter}
      />
      <SequenceEditMenu
        label="Chapter options"
        items={[
          { title: "Move chapter up", onClick: () => onMove("up"), disabled: !canMoveUp },
          { title: "Move chapter down", onClick: () => onMove("down"), disabled: !canMoveDown },
        ]}
      />
      <LWTooltip title={deleteTooltip}>
        <button className={classes.deleteButton} disabled={!canDelete} onClick={onDelete} aria-label={deleteTooltip}>
          <ForumIcon icon="Close" className={classes.deleteIcon} />
        </button>
      </LWTooltip>
    </div>
    <div className={classes.description}>
      <AutoSavedEditorField
        document={descriptionDocument}
        fieldName="contents"
        collectionName="Chapters"
        hintText="Add chapter description"
        commentEditor
        commentStyles={false}
        hideControls
        fitToContent
        onCommit={onDescriptionCommit}
      />
    </div>
    <div className={classes.posts}>
      {children}
    </div>
  </div>;
};

export default SequenceEditChapter;
