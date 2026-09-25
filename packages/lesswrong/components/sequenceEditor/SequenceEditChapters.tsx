import React, { useCallback, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles, useStyles } from "../hooks/useStyles";
import Loading from "../vulcan-core/Loading";
import ForumIcon from "../common/ForumIcon";
import SequenceEditChapter from "./SequenceEditChapter";
import SequenceEditPostRow from "./SequenceEditPostRow";
import SequenceAddPostBox from "./SequenceAddPostBox";
import type { SequenceEditMenuItem } from "./SequenceEditMenu";
import { type ChapterEditing, useChapterEditing } from "./useChapterEditing";
import { type EditableChapter, canDeleteChapter, findPostChapter, isChapterless, movePost } from "./sequenceStructure";

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

const CHAPTER_DROPPABLE_PREFIX = "chapter:";

const SortablePostRow = ({ postId, loadedPost, menuItems, onRemove }: {
  postId: string,
  loadedPost?: PostsList,
  menuItems: SequenceEditMenuItem[],
  onRemove: () => void,
}) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: postId });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
    <SequenceEditPostRow
      postId={postId}
      loadedPost={loadedPost}
      dragHandleProps={{ ref: setActivatorNodeRef, attributes, listeners }}
      isDragging={isDragging}
      menuItems={menuItems}
      onRemove={onRemove}
    />
  </div>;
};

/** A chapter's post list: sortable, and a drop target even when empty. */
const ChapterPostList = ({ chapterId, postIds, children }: {
  chapterId: string,
  postIds: string[],
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const { setNodeRef } = useDroppable({ id: `${CHAPTER_DROPPABLE_PREFIX}${chapterId}` });
  return <SortableContext id={chapterId} items={postIds} strategy={verticalListSortingStrategy}>
    <div ref={setNodeRef}>
      {children}
      {postIds.length === 0 && <div className={classes.emptyList}>No posts yet</div>}
    </div>
  </SortableContext>;
};

function chapterForDragTarget(chapters: EditableChapter[], id: string): EditableChapter | undefined {
  if (id.startsWith(CHAPTER_DROPPABLE_PREFIX)) {
    const chapterId = id.slice(CHAPTER_DROPPABLE_PREFIX.length);
    return chapters.find((c) => c._id === chapterId);
  }
  return findPostChapter(chapters, id);
}

function chapterName(chapters: EditableChapter[], chapter: EditableChapter): string {
  if (chapter.title) return `“${chapter.title}”`;
  return chapters.length === 1 ? "this sequence" : `chapter ${chapters.indexOf(chapter) + 1}`;
}

/**
 * Dragging posts between chapters: while dragging, a preview of the chapters
 * follows the pointer across chapters; on drop, the move is applied and saved.
 */
function useChapterDragAndDrop(editing: ChapterEditing) {
  const [preview, setPreview] = useState<EditableChapter[] | null>(null);
  const [origin, setOrigin] = useState<{ postId: string, chapterId: string } | null>(null);

  const onDragStart = useCallback(({ active }: DragStartEvent) => {
    const postId = String(active.id);
    const chapter = findPostChapter(editing.chapters, postId);
    if (chapter) {
      setOrigin({ postId, chapterId: chapter._id });
      setPreview(editing.chapters);
    }
  }, [editing.chapters]);

  const onDragOver = useCallback(({ active, over }: DragOverEvent) => {
    if (!over || !preview) return;
    const postId = String(active.id);
    const from = findPostChapter(preview, postId);
    const to = chapterForDragTarget(preview, String(over.id));
    if (!from || !to || from._id === to._id) return;
    const overIndex = to.postIds.indexOf(String(over.id));
    setPreview(movePost(preview, postId, from._id, to._id, overIndex >= 0 ? overIndex : to.postIds.length));
  }, [preview]);

  const onDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    if (origin && preview && over) {
      const postId = String(active.id);
      const current = findPostChapter(preview, postId);
      if (current) {
        const overIndex = current.postIds.indexOf(String(over.id));
        const toIndex = overIndex >= 0 ? overIndex : current.postIds.indexOf(postId);
        const originIndex = editing.chapters.find((c) => c._id === origin.chapterId)?.postIds.indexOf(postId);
        if (current._id !== origin.chapterId || toIndex !== originIndex) {
          editing.movePost(postId, origin.chapterId, current._id, toIndex);
        }
      }
    }
    setPreview(null);
    setOrigin(null);
  }, [origin, preview, editing]);

  const onDragCancel = useCallback(() => {
    setPreview(null);
    setOrigin(null);
  }, []);

  return { displayedChapters: preview ?? editing.chapters, onDragStart, onDragOver, onDragEnd, onDragCancel };
}

const SequenceEditChaptersInner = ({ sequenceId, initialChapters, refetchChapters }: {
  sequenceId: string,
  initialChapters: ChaptersEdit[],
  refetchChapters: () => Promise<ChaptersEdit[]>,
}) => {
  const classes = useStyles(styles);
  const editing = useChapterEditing({ sequenceId, initialChapters, refetchChapters });
  const { chapters, loadedPosts } = editing;
  const { displayedChapters, ...dragHandlers } = useChapterDragAndDrop(editing);
  // Set when "Add chapter" is clicked on a sequence with no chapters: shows
  // the (still untitled) chapter's heading so a title can be typed.
  const [showChapterHeadings, setShowChapterHeadings] = useState(false);
  const [addingPostToChapterId, setAddingPostToChapterId] = useState<string | null>(null);
  const [focusTitleOfChapterId, setFocusTitleOfChapterId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const renderPosts = (chapter: EditableChapter) => <ChapterPostList chapterId={chapter._id} postIds={chapter.postIds}>
    {chapter.postIds.map((postId) => <SortablePostRow
      key={postId}
      postId={postId}
      loadedPost={loadedPosts[postId]}
      menuItems={postMenuItems(chapter, postId)}
      onRemove={() => editing.removePost(chapter._id, postId)}
    />)}
  </ChapterPostList>;

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

  // Every sequence should have a chapter, but don't crash on one that doesn't.
  if (!chapters.length) {
    return <div className={classes.root}>
      <div className={classes.buttonRow}>
        <button className={classes.addButton} onClick={() => setFocusTitleOfChapterId(editing.addChapter())}>
          <ForumIcon icon="Plus" className={classes.addIcon} /> Add chapter
        </button>
      </div>
    </div>;
  }

  return <div className={classes.root}>
    <DndContext sensors={sensors} collisionDetection={closestCorners} {...dragHandlers}>
      {chapterless
        ? <>
            {renderPosts(displayedChapters[0])}
            {renderAddPost(chapters[0])}
            <div className={classes.buttonRow}>
              {addPostButton(chapters[0]._id)}
              {addChapterButton}
            </div>
          </>
        : <>
            {displayedChapters.map((chapter, index) => <SequenceEditChapter
              key={chapter._id}
              chapter={chapter}
              canMoveUp={index > 0}
              canMoveDown={index < displayedChapters.length - 1}
              canDelete={canDeleteChapter(chapters, chapter._id)}
              isOnlyChapter={chapters.length === 1}
              autoFocusTitle={focusTitleOfChapterId === chapter._id}
              onTitleChange={(title) => editing.setChapterTitle(chapter._id, title)}
              onDescriptionChange={(text) => editing.setChapterDescription(chapter._id, text)}
              onMove={(direction) => editing.moveChapter(chapter._id, direction)}
              onDelete={() => deleteChapter(chapter._id)}
            >
              {renderPosts(chapter)}
              {renderAddPost(chapter)}
              {addingPostToChapterId !== chapter._id && <div className={classes.buttonRow}>{addPostButton(chapter._id)}</div>}
            </SequenceEditChapter>)}
            <div className={classes.addChapterRow}>{addChapterButton}</div>
          </>
      }
    </DndContext>
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
