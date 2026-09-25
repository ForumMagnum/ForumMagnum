import React, { useEffect, useState } from "react";
import AutoGrowTextarea from "./AutoGrowTextarea";
import classNames from "classnames";
import { defineStyles, useStyles } from "../hooks/useStyles";
import ForumIcon from "../common/ForumIcon";
import LWTooltip from "../common/LWTooltip";
import SequenceEditMenu from "./SequenceEditMenu";
import type { EditableChapter } from "./sequenceStructure";

const styles = defineStyles("SequenceEditChapter", (theme: ThemeType) => ({
  root: {
    marginTop: 28,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  inlineInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    borderRadius: 4,
    padding: "2px 4px",
    margin: "0 -4px",
    color: "inherit",
    "&:hover": {
      background: theme.palette.greyAlpha(0.04),
    },
    "&:focus": {
      background: theme.palette.greyAlpha(0.06),
    },
    "&::placeholder": {
      color: theme.palette.greyAlpha(0.35),
    },
  },
  // Matches ChapterTitle's large style in reading mode.
  titleInput: {
    ...theme.typography.chapterTitle,
    ...theme.typography.largeChapterTitle,
    fontFamily: "inherit",
    margin: 0,
    flexGrow: 1,
    minWidth: 0,
    resize: "none",
    overflow: "hidden",
  },
  description: {
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    width: "100%",
    resize: "none",
    overflow: "hidden",
    marginTop: 8,
    marginLeft: 6,
    lineHeight: 1.5,
  },
  addDescriptionLink: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    color: theme.palette.greyAlpha(0.45),
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px 0",
    "&:hover": {
      color: theme.palette.greyAlpha(0.8),
    },
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
 * One chapter in the sequence editor: its title, optional plain-text
 * description, menu and delete button, then its posts (passed as children).
 */
const SequenceEditChapter = ({
  chapter,
  canMoveUp,
  canMoveDown,
  canDelete,
  isOnlyChapter,
  autoFocusTitle,
  onTitleChange,
  onDescriptionChange,
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
  onDescriptionChange: (text: string) => void,
  onMove: (direction: "up" | "down") => void,
  onDelete: () => void,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const [title, setTitle] = useState(chapter.title ?? "");
  const [description, setDescription] = useState(chapter.descriptionText);
  const [showDescription, setShowDescription] = useState(!!chapter.descriptionText);
  const [focusDescription, setFocusDescription] = useState(false);

  // Keep the fields in step if the chapter changes from outside (e.g. after
  // reloading from the server when a save failed).
  useEffect(() => setTitle(chapter.title ?? ""), [chapter.title]);
  useEffect(() => {
    setDescription(chapter.descriptionText);
    if (chapter.descriptionText) setShowDescription(true);
  }, [chapter.descriptionText]);

  const saveDescription = () => {
    onDescriptionChange(description);
    if (!description.trim()) {
      setShowDescription(false);
    }
  };

  const deleteTooltip = canDelete
    ? (isOnlyChapter ? "Remove chapter (keeps its posts)" : "Delete chapter")
    : "Move or remove this chapter's posts first";

  return <div className={classes.root}>
    <div className={classes.header}>
      <AutoGrowTextarea
        className={classNames(classes.inlineInput, classes.titleInput)}
        value={title}
        placeholder="Chapter title"
        autoFocus={autoFocusTitle}
        singleLine
        onChange={setTitle}
        onBlur={() => onTitleChange(title)}
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
    {showDescription
      ? <AutoGrowTextarea
          className={classNames(classes.inlineInput, classes.description)}
          value={description}
          placeholder="Chapter description"
          autoFocus={focusDescription}
          onChange={setDescription}
          onBlur={saveDescription}
        />
      : <button className={classes.addDescriptionLink} onClick={() => { setShowDescription(true); setFocusDescription(true); }}>
          Add chapter description
        </button>
    }
    <div className={classes.posts}>
      {children}
    </div>
  </div>;
};

export default SequenceEditChapter;
