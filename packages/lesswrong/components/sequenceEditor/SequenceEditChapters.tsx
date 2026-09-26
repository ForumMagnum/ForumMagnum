import React, { useCallback, useState } from "react";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles, useStyles } from "../hooks/useStyles";
import Loading from "../vulcan-core/Loading";
import ForumIcon from "../common/ForumIcon";
import { MultiRegionSortableList, type RegionItemMove } from "../form-components/multiRegionSortableList";
import type { DragHandleProps } from "../form-components/sortableList";
import SequenceEditChapter from "./SequenceEditChapter";
import SequenceEditPostRow from "./SequenceEditPostRow";
import SequenceAddPostBox from "./SequenceAddPostBox";
import type { SequenceEditMenuItem } from "./SequenceEditMenu";
import { useChapterEditing } from "./useChapterEditing";
import { type EditableChapter, canDeleteChapter, findPostChapter, isChapterless } from "./sequenceStructure";

const SequenceEditChaptersQuery = gql(`
  query SequenceEditChapters($selector: ChapterSelector, $limit: Int) {
    chapters(selector: $selector, limit: $limit, enableTotal: false) {
      results {
        ...ChaptersEdit
      }
    }
  }
`);

const styles = defineStyles("SequenceEditChapters", (theme: ThemeType) => ({
  root: {},
  emptyList: {
    ...theme.typography.commentStyle,
    fontSize: 14,
    color: theme.palette.greyAlpha(0.45),
    padding: "12px 4px",
    borderBottom: theme.palette.border.itemSeparatorBottom,
  },
  buttonRow: {
    display: "flex",
    gap: 8,
    marginTop: 12,
  },
  addButton: {
    ...theme.typography.commentStyle,
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 14,
    fontWeight: 500,
    padding: "6px 12px 6px 8px",
    borderRadius: 8,
    border: theme.palette.greyBorder("1px", 0.14),
    background: "none",
    color: theme.palette.greyAlpha(0.7),
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.greyAlpha(0.04),
      color: theme.palette.greyAlpha(0.9),
    },
  },
  addIcon: {
    width: 18,
    height: 18,
  },
  addChapterRow: {
    marginTop: 28,
  },
}));

function chapterName(chapters: EditableChapter[], chapter: EditableChapter): string {
  if (chapter.title) return `“${chapter.title}”`;
  return chapters.length === 1 ? "this sequence" : `chapter ${chapters.indexOf(chapter) + 1}`;
}

/**
 * The chapters editor once the chapters have loaded. A sequence whose only
 * chapter has no title or description is shown as a plain list of posts;
 * clicking "Add chapter" there sets `showChapterHeadings`, which shows that
 * (still untitled) chapter's heading so a title can be typed. Each chapter
 * is a region of a MultiRegionSortableList: its posts can be dragged within
 * it or to another chapter, but not above its heading or below its Add post.
 * Every sequence should have a chapter, but one with none still gets an "Add
 * chapter" button rather than crashing.
 */
const SequenceEditChaptersInner = ({ sequenceId, initialChapters, refetchChapters }: {
  sequenceId: string,
  initialChapters: ChaptersEdit[],
  refetchChapters: () => Promise<ChaptersEdit[]>,
}) => {
  const classes = useStyles(styles);
  const editing = useChapterEditing({ sequenceId, initialChapters, refetchChapters });
  const { chapters, loadedPosts } = editing;
  const [showChapterHeadings, setShowChapterHeadings] = useState(false);
  const [addingPostToChapterId, setAddingPostToChapterId] = useState<string | null>(null);
  const [focusTitleOfChapterId, setFocusTitleOfChapterId] = useState<string | null>(null);

  const chapterless = isChapterless(chapters) && !showChapterHeadings;

  const getChapterNameForPost = (postId: string) => {
    const chapter = findPostChapter(chapters, postId);
    return chapter ? chapterName(chapters, chapter) : null;
  };

  const addChapter = () => {
    if (chapterless) {
      setShowChapterHeadings(true);
      setFocusTitleOfChapterId(chapters[0]._id);
    } else {
      setFocusTitleOfChapterId(editing.addChapter());
    }
    setAddingPostToChapterId(null);
  };

  const deleteChapter = (chapterId: string) => {
    if (chapters.length === 1) {
      setShowChapterHeadings(false);
    }
    editing.deleteChapter(chapterId);
  };

  const postMenuItems = (chapter: EditableChapter, postId: string): SequenceEditMenuItem[] => {
    const index = chapter.postIds.indexOf(postId);
    return [
      { title: "Move up", disabled: index === 0, onClick: () => editing.movePost(postId, chapter._id, chapter._id, index - 1) },
      { title: "Move down", disabled: index === chapter.postIds.length - 1, onClick: () => editing.movePost(postId, chapter._id, chapter._id, index + 1) },
      ...chapters.filter((other) => other._id !== chapter._id).map((other) => ({
        title: `Move to ${chapterName(chapters, other)}`,
        onClick: () => editing.movePost(postId, chapter._id, other._id, other.postIds.length),
      })),
    ];
  };

  const renderPost = (postId: string, dragHandleProps: DragHandleProps, isDragging: boolean) => {
    const chapter = findPostChapter(chapters, postId);
    if (!chapter) return null;
    return <SequenceEditPostRow
      postId={postId}
      loadedPost={loadedPosts[postId]}
      dragHandleProps={dragHandleProps}
      isDragging={isDragging}
      menuItems={postMenuItems(chapter, postId)}
      onRemove={() => editing.removePost(chapter._id, postId)}
    />;
  };

  const applyMove = ({ itemId, fromRegionId, toRegionId, toIndex }: RegionItemMove) => {
    editing.movePost(itemId, fromRegionId, toRegionId, toIndex);
  };

  const renderAddPost = (chapter: EditableChapter) => addingPostToChapterId === chapter._id
    ? <SequenceAddPostBox
        onAdd={(postId) => editing.addPost(chapter._id, postId)}
        onClose={() => setAddingPostToChapterId(null)}
        getChapterNameForPost={getChapterNameForPost}
      />
    : null;

  const addPostButton = (chapterId: string) => <button className={classes.addButton} onClick={() => setAddingPostToChapterId(chapterId)}>
    <ForumIcon icon="Plus" className={classes.addIcon} /> Add post
  </button>;

  const addChapterButton = <button className={classes.addButton} onClick={addChapter}>
    <ForumIcon icon="Plus" className={classes.addIcon} /> Add chapter
  </button>;

  if (!chapters.length) {
    return <div className={classes.root}>
      <div className={classes.buttonRow}>
        <button className={classes.addButton} onClick={() => setFocusTitleOfChapterId(editing.addChapter())}>
          <ForumIcon icon="Plus" className={classes.addIcon} /> Add chapter
        </button>
      </div>
    </div>;
  }

  const renderChapter = (chapterId: string, posts: React.ReactNode) => {
    const index = chapters.findIndex((c) => c._id === chapterId);
    const chapter = chapters[index];
    if (!chapter) return null;
    if (chapterless) {
      return <>
        {posts}
        {renderAddPost(chapter)}
        <div className={classes.buttonRow}>
          {addPostButton(chapter._id)}
          {addChapterButton}
        </div>
      </>;
    }
    return <SequenceEditChapter
      key={`${chapter._id}-${editing.version}`}
      chapter={chapter}
      canMoveUp={index > 0}
      canMoveDown={index < chapters.length - 1}
      canDelete={canDeleteChapter(chapters, chapter._id)}
      isOnlyChapter={chapters.length === 1}
      autoFocusTitle={focusTitleOfChapterId === chapter._id}
      onTitleChange={(title) => editing.setChapterTitle(chapter._id, title)}
      onDescriptionCommit={(description) => editing.setChapterDescription(chapter._id, description)}
      onMove={(direction) => editing.moveChapter(chapter._id, direction)}
      onDelete={() => deleteChapter(chapter._id)}
    >
      {posts}
      {renderAddPost(chapter)}
      {addingPostToChapterId !== chapter._id && <div className={classes.buttonRow}>{addPostButton(chapter._id)}</div>}
    </SequenceEditChapter>;
  };

  return <div className={classes.root}>
    <MultiRegionSortableList
      regions={chapters.map((chapter) => ({ id: chapter._id, itemIds: chapter.postIds }))}
      onMove={applyMove}
      renderItem={renderPost}
      renderRegion={renderChapter}
      renderEmptyRegion={() => <div className={classes.emptyList}>No posts yet</div>}
    />
    {!chapterless && <div className={classes.addChapterRow}>{addChapterButton}</div>}
  </div>;
};

/** The chapters and posts of a sequence, in edit mode. */
const SequenceEditChapters = ({ sequenceId }: { sequenceId: string }) => {
  const { data, refetch } = useQuery(SequenceEditChaptersQuery, {
    variables: { selector: { SequenceChapters: { sequenceId } }, limit: 100 },
    fetchPolicy: "network-only",
    ssr: false,
  });
  const chapters = data?.chapters?.results;

  const refetchChapters = useCallback(async () => {
    const result = await refetch();
    return result.data?.chapters?.results ?? [];
  }, [refetch]);

  if (!chapters) {
    return <Loading />;
  }
  return <SequenceEditChaptersInner sequenceId={sequenceId} initialChapters={chapters} refetchChapters={refetchChapters} />;
};

export default SequenceEditChapters;
