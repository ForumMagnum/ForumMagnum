import { useCallback, useRef, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { randomId } from "@/lib/random";
import { descriptionHtmlToPlainText, plainTextToDescriptionHtml } from "@/lib/collections/chapters/plainTextDescription";
import * as structure from "./sequenceStructure";
import type { EditableChapter } from "./sequenceStructure";
import { useSequenceEditor } from "./SequenceEditorContext";

const SequenceEditorUpdateChapterMutation = gql(`
  mutation updateChapterSequenceEditor($selector: SelectorInput!, $data: UpdateChapterDataInput!) {
    updateChapter(selector: $selector, data: $data) {
      data {
        ...ChaptersEdit
      }
    }
  }
`);

const SequenceEditorCreateChapterMutation = gql(`
  mutation createChapterSequenceEditor($data: CreateChapterDataInput!) {
    createChapter(data: $data) {
      data {
        ...ChaptersEdit
      }
    }
  }
`);

const SequenceEditorDeleteChapterMutation = gql(`
  mutation deleteChapterSequenceEditor($chapterId: String!) {
    deleteChapter(chapterId: $chapterId)
  }
`);

const SequenceEditorMovePostMutation = gql(`
  mutation moveSequencePostSequenceEditor($postId: String!, $fromChapterId: String!, $toChapterId: String!, $toIndex: Int!) {
    moveSequencePost(postId: $postId, fromChapterId: $fromChapterId, toChapterId: $toChapterId, toIndex: $toIndex)
  }
`);

// The reading-mode chapter list; refetched when chapters are added or removed.
const READING_CHAPTERS_QUERY = "multiChapterChaptersListQuery";

const EMPTY_DESCRIPTION = { originalContents: { type: "html", data: "" } };

export function toEditableChapter(chapter: ChaptersEdit): EditableChapter {
  return {
    _id: chapter._id,
    title: chapter.title ?? null,
    descriptionText: descriptionHtmlToPlainText(chapter.contents?.html ?? ""),
    postIds: chapter.postIds,
  };
}

function postsById(chapters: ChaptersEdit[]): Record<string, PostsList> {
  return Object.fromEntries(chapters.flatMap((chapter) => chapter.posts.map((post) => [post._id, post])));
}

export interface ChapterEditing {
  chapters: EditableChapter[];
  /** Posts loaded with the chapters, by id. Rows for other posts fetch their own. */
  loadedPosts: Record<string, PostsList>;
  addPost: (chapterId: string, postId: string) => void;
  removePost: (chapterId: string, postId: string) => void;
  movePost: (postId: string, fromChapterId: string, toChapterId: string, toIndex: number) => void;
  setChapterTitle: (chapterId: string, title: string) => void;
  setChapterDescription: (chapterId: string, text: string) => void;
  /** Adds an empty chapter at the end and returns its (temporary) id. */
  addChapter: () => string;
  deleteChapter: (chapterId: string) => void;
  moveChapter: (chapterId: string, direction: "up" | "down") => void;
}

/**
 * Local chapter/post state for the sequence editor. Every change is applied
 * locally straight away and saved through the editor's save queue. If a save
 * fails, the chapters are reloaded from the server, since later queued
 * changes may have built on the one that failed.
 */
export function useChapterEditing({ sequenceId, initialChapters, refetchChapters }: {
  sequenceId: string,
  initialChapters: ChaptersEdit[],
  refetchChapters: () => Promise<ChaptersEdit[]>,
}): ChapterEditing {
  const { enqueueSave } = useSequenceEditor();
  const [chapters, setChaptersState] = useState<EditableChapter[]>(() => initialChapters.map(toEditableChapter));
  const [loadedPosts, setLoadedPosts] = useState<Record<string, PostsList>>(() => postsById(initialChapters));
  const chaptersRef = useRef(chapters);
  // Chapters created in this session get a temporary id until the server
  // returns the real one. Saves queued meanwhile look the real id up here.
  const realIdsRef = useRef<Record<string, string>>({});
  const numbersRef = useRef<Record<string, number | null>>(
    Object.fromEntries(initialChapters.map((chapter) => [chapter._id, chapter.number ?? null])),
  );

  const [updateChapterMutation] = useMutation(SequenceEditorUpdateChapterMutation);
  const [createChapterMutation] = useMutation(SequenceEditorCreateChapterMutation);
  const [deleteChapterMutation] = useMutation(SequenceEditorDeleteChapterMutation);
  const [movePostMutation] = useMutation(SequenceEditorMovePostMutation);

  const setChapters = useCallback((next: EditableChapter[]) => {
    chaptersRef.current = next;
    setChaptersState(next);
  }, []);

  const realId = useCallback((chapterId: string) => realIdsRef.current[chapterId] ?? chapterId, []);

  const resyncFromServer = useCallback(async () => {
    const serverChapters = await refetchChapters();
    realIdsRef.current = {};
    numbersRef.current = Object.fromEntries(serverChapters.map((chapter) => [chapter._id, chapter.number ?? null]));
    setLoadedPosts(postsById(serverChapters));
    setChapters(serverChapters.map(toEditableChapter));
  }, [refetchChapters, setChapters]);

  const rememberPosts = useCallback((chapter: ChaptersEdit | null | undefined) => {
    if (chapter) {
      setLoadedPosts((previous) => ({ ...previous, ...postsById([chapter]) }));
    }
  }, []);

  const saveChapter = useCallback((chapterId: string, data: UpdateChapterDataInput) => {
    enqueueSave(async () => {
      const result = await updateChapterMutation({ variables: { selector: { _id: realId(chapterId) }, data } });
      rememberPosts(result.data?.updateChapter?.data);
    }, () => void resyncFromServer());
  }, [enqueueSave, updateChapterMutation, realId, rememberPosts, resyncFromServer]);

  // Chapters are ordered by `number`. Older chapters often have none, so give
  // every chapter whose stored number doesn't match its position a new one.
  const saveChapterOrder = useCallback((ordered: EditableChapter[]) => {
    ordered.forEach((chapter, index) => {
      const number = index + 1;
      if (numbersRef.current[chapter._id] !== number) {
        numbersRef.current[chapter._id] = number;
        saveChapter(chapter._id, { number });
      }
    });
  }, [saveChapter]);

  const savePostIds = useCallback((next: EditableChapter[], chapterId: string) => {
    const chapter = next.find((c) => c._id === chapterId);
    if (chapter) {
      saveChapter(chapterId, { postIds: chapter.postIds });
    }
  }, [saveChapter]);

  const addPost = useCallback((chapterId: string, postId: string) => {
    if (structure.findPostChapter(chaptersRef.current, postId)) return;
    const next = structure.addPost(chaptersRef.current, chapterId, postId);
    setChapters(next);
    savePostIds(next, chapterId);
  }, [setChapters, savePostIds]);

  const removePost = useCallback((chapterId: string, postId: string) => {
    const next = structure.removePost(chaptersRef.current, chapterId, postId);
    setChapters(next);
    savePostIds(next, chapterId);
  }, [setChapters, savePostIds]);

  const movePost = useCallback((postId: string, fromChapterId: string, toChapterId: string, toIndex: number) => {
    const next = structure.movePost(chaptersRef.current, postId, fromChapterId, toChapterId, toIndex);
    setChapters(next);
    if (fromChapterId === toChapterId) {
      savePostIds(next, toChapterId);
    } else {
      enqueueSave(
        () => movePostMutation({ variables: { postId, fromChapterId: realId(fromChapterId), toChapterId: realId(toChapterId), toIndex } }),
        () => void resyncFromServer(),
      );
    }
  }, [setChapters, savePostIds, enqueueSave, movePostMutation, realId, resyncFromServer]);

  const setChapterTitle = useCallback((chapterId: string, title: string) => {
    const trimmed = title.trim() || null;
    const current = chaptersRef.current.find((c) => c._id === chapterId);
    if (!current || (current.title ?? null) === trimmed) return;
    setChapters(chaptersRef.current.map((c) => c._id === chapterId ? { ...c, title: trimmed } : c));
    saveChapter(chapterId, { title: trimmed });
  }, [setChapters, saveChapter]);

  const setChapterDescription = useCallback((chapterId: string, text: string) => {
    const current = chaptersRef.current.find((c) => c._id === chapterId);
    if (!current || current.descriptionText.trim() === text.trim()) return;
    setChapters(chaptersRef.current.map((c) => c._id === chapterId ? { ...c, descriptionText: text.trim() } : c));
    saveChapter(chapterId, { contents: { originalContents: { type: "html", data: plainTextToDescriptionHtml(text) } } });
  }, [setChapters, saveChapter]);

  const addChapter = useCallback(() => {
    const tempId = `new-${randomId()}`;
    const next = [...chaptersRef.current, { _id: tempId, title: null, descriptionText: "", postIds: [] }];
    // Number the existing chapters first, so the new one sorts after them.
    saveChapterOrder(chaptersRef.current);
    setChapters(next);
    numbersRef.current[tempId] = next.length;
    enqueueSave(async () => {
      const result = await createChapterMutation({
        variables: { data: { sequenceId, number: next.length, postIds: [] } },
        refetchQueries: [READING_CHAPTERS_QUERY],
      });
      const created = result.data?.createChapter?.data;
      if (!created) throw new Error("Couldn't create the chapter");
      realIdsRef.current[tempId] = created._id;
    }, () => void resyncFromServer());
    return tempId;
  }, [saveChapterOrder, setChapters, enqueueSave, createChapterMutation, sequenceId, resyncFromServer]);

  const deleteChapter = useCallback((chapterId: string) => {
    const current = chaptersRef.current;
    if (!structure.canDeleteChapter(current, chapterId)) return;
    if (current.length === 1) {
      // The last chapter stays; removing its title and description turns
      // the sequence back into a plain list of posts.
      setChapters([{ ...current[0], title: null, descriptionText: "" }]);
      saveChapter(chapterId, { title: null, contents: EMPTY_DESCRIPTION });
      return;
    }
    setChapters(current.filter((c) => c._id !== chapterId));
    enqueueSave(
      () => deleteChapterMutation({ variables: { chapterId: realId(chapterId) }, refetchQueries: [READING_CHAPTERS_QUERY] }),
      () => void resyncFromServer(),
    );
  }, [setChapters, saveChapter, enqueueSave, deleteChapterMutation, realId, resyncFromServer]);

  const moveChapter = useCallback((chapterId: string, direction: "up" | "down") => {
    const next = structure.moveChapter(chaptersRef.current, chapterId, direction);
    setChapters(next);
    saveChapterOrder(next);
  }, [setChapters, saveChapterOrder]);

  return {
    chapters,
    loadedPosts,
    addPost,
    removePost,
    movePost,
    setChapterTitle,
    setChapterDescription,
    addChapter,
    deleteChapter,
    moveChapter,
  };
}
