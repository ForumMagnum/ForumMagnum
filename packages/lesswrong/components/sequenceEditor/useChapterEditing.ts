import { useCallback, useRef, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { randomId } from "@/lib/random";
import * as structure from "./sequenceStructure";
import type { ChapterDescription, EditableChapter } from "./sequenceStructure";
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

/** The reading-mode chapter list's query, refetched when chapters are added or removed. */
const READING_CHAPTERS_QUERY = "multiChapterChaptersListQuery";

const EMPTY_DESCRIPTION = { originalContents: { type: "lexical", data: "" } };

/**
 * A chapter description, opened in the rich-text (Lexical) editor whatever
 * format it was saved in. Chapter descriptions have been saved as HTML, which
 * would otherwise open a raw HTML editor. Lexical's saved format is HTML, so
 * the rendered HTML loads into it without loss, and saves back as Lexical.
 */
function toChapterDescription(contents: ChaptersEdit["contents"]): ChapterDescription | null {
  const html = contents?.html ?? "";
  if (structure.isBlankDescriptionHtml(html)) {
    return null;
  }
  return { originalContents: { type: "lexical", data: html } };
}

export function toEditableChapter(chapter: ChaptersEdit): EditableChapter {
  return {
    _id: chapter._id,
    title: chapter.title ?? null,
    description: toChapterDescription(chapter.contents),
    postIds: chapter.postIds,
  };
}

function postsById(chapters: ChaptersEdit[]): Record<string, PostsList> {
  return Object.fromEntries(chapters.flatMap((chapter) => chapter.posts.map((post) => [post._id, post])));
}

/**
 * The sequence editor's chapters and the actions that change them.
 * `version` changes each time the chapters are reloaded from the server.
 * `loadedPosts` holds the posts loaded with the chapters, by id; rows for
 * other posts fetch their own. `setChapterDescription` resolves to whether
 * the description was saved, and `addChapter` returns the new chapter's
 * temporary id.
 */
export interface ChapterEditing {
  chapters: EditableChapter[];
  version: number;
  loadedPosts: Record<string, PostsList>;
  addPost: (chapterId: string, postId: string) => void;
  removePost: (chapterId: string, postId: string) => void;
  movePost: (postId: string, fromChapterId: string, toChapterId: string, toIndex: number) => void;
  setChapterTitle: (chapterId: string, title: string) => void;
  setChapterDescription: (chapterId: string, description: ChapterDescription) => Promise<boolean>;
  addChapter: () => string;
  deleteChapter: (chapterId: string) => void;
  moveChapter: (chapterId: string, direction: "up" | "down") => void;
}

/**
 * Local chapter/post state for the sequence editor. Every change is applied
 * locally straight away and saved through the editor's save queue.
 *
 * - **Failed saves:** the chapters are reloaded from the server, since later
 *   queued changes may have built on the one that failed. The reload waits
 *   until every queued save has finished; reloading earlier would show a
 *   state that later saves then change behind the page's back.
 * - **New chapters** get a temporary id until the server returns the real
 *   one; saves queued meanwhile look the real id up in `realIdsRef`. The
 *   mappings survive a reload, since saves queued before it may still use them.
 * - **Order:** chapters are ordered by `number`, and older chapters often have
 *   none, so every chapter whose stored number doesn't match its position
 *   gets a new one. Adding a chapter numbers the existing ones first, so the
 *   new one sorts after them.
 * - **Deleting the only chapter** keeps it but removes its title and
 *   description, which turns the sequence back into a plain list of posts.
 */
export function useChapterEditing({ sequenceId, initialChapters, refetchChapters }: {
  sequenceId: string,
  initialChapters: ChaptersEdit[],
  refetchChapters: () => Promise<ChaptersEdit[]>,
}): ChapterEditing {
  const { enqueueSave, drainSaves } = useSequenceEditor();
  const [chapters, setChaptersState] = useState<EditableChapter[]>(() => initialChapters.map(toEditableChapter));
  const [loadedPosts, setLoadedPosts] = useState<Record<string, PostsList>>(() => postsById(initialChapters));
  const [version, setVersion] = useState(0);
  const chaptersRef = useRef(chapters);
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

  const resyncPendingRef = useRef(false);
  const resyncFromServer = useCallback(() => {
    if (resyncPendingRef.current) return;
    resyncPendingRef.current = true;
    void (async () => {
      try {
        let tail = drainSaves();
        await tail;
        while (drainSaves() !== tail) {
          tail = drainSaves();
          await tail;
        }
        const serverChapters = await refetchChapters();
        numbersRef.current = Object.fromEntries(serverChapters.map((chapter) => [chapter._id, chapter.number ?? null]));
        setLoadedPosts(postsById(serverChapters));
        setChapters(serverChapters.map(toEditableChapter));
        setVersion((previous) => previous + 1);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Couldn't reload the sequence's chapters", e);
      } finally {
        resyncPendingRef.current = false;
      }
    })();
  }, [drainSaves, refetchChapters, setChapters]);

  const rememberPosts = useCallback((chapter: ChaptersEdit | null | undefined) => {
    if (chapter) {
      setLoadedPosts((previous) => ({ ...previous, ...postsById([chapter]) }));
    }
  }, []);

  const saveChapter = useCallback((chapterId: string, data: UpdateChapterDataInput) => new Promise<boolean>((resolve) => {
    enqueueSave(async () => {
      const result = await updateChapterMutation({ variables: { selector: { _id: realId(chapterId) }, data } });
      rememberPosts(result.data?.updateChapter?.data);
      resolve(true);
    }, () => {
      resolve(false);
      resyncFromServer();
    });
  }), [enqueueSave, updateChapterMutation, realId, rememberPosts, resyncFromServer]);

  const saveChapterOrder = useCallback((ordered: EditableChapter[]) => {
    ordered.forEach((chapter, index) => {
      const number = index + 1;
      if (numbersRef.current[chapter._id] !== number) {
        numbersRef.current[chapter._id] = number;
        void saveChapter(chapter._id, { number });
      }
    });
  }, [saveChapter]);

  const savePostIds = useCallback((next: EditableChapter[], chapterId: string) => {
    const chapter = next.find((c) => c._id === chapterId);
    if (chapter) {
      void saveChapter(chapterId, { postIds: chapter.postIds });
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
        resyncFromServer,
      );
    }
  }, [setChapters, savePostIds, enqueueSave, movePostMutation, realId, resyncFromServer]);

  const setChapterTitle = useCallback((chapterId: string, title: string) => {
    const trimmed = title.trim() || null;
    const current = chaptersRef.current.find((c) => c._id === chapterId);
    if (!current || (current.title ?? null) === trimmed) return;
    setChapters(chaptersRef.current.map((c) => c._id === chapterId ? { ...c, title: trimmed } : c));
    void saveChapter(chapterId, { title: trimmed });
  }, [setChapters, saveChapter]);

  const setChapterDescription = useCallback(async (chapterId: string, description: ChapterDescription) => {
    const current = chaptersRef.current.find((c) => c._id === chapterId);
    if (!current) return false;
    const isBlank = structure.isBlankDescriptionHtml(description.originalContents.data);
    if (isBlank && !current.description) return true;
    setChapters(chaptersRef.current.map((c) => c._id === chapterId ? { ...c, description: isBlank ? null : description } : c));
    return saveChapter(chapterId, { contents: isBlank ? EMPTY_DESCRIPTION : { originalContents: description.originalContents } });
  }, [setChapters, saveChapter]);

  const addChapter = useCallback(() => {
    const tempId = `new-${randomId()}`;
    const next = [...chaptersRef.current, { _id: tempId, title: null, description: null, postIds: [] }];
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
    }, resyncFromServer);
    return tempId;
  }, [saveChapterOrder, setChapters, enqueueSave, createChapterMutation, sequenceId, resyncFromServer]);

  const deleteChapter = useCallback((chapterId: string) => {
    const current = chaptersRef.current;
    if (!structure.canDeleteChapter(current, chapterId)) return;
    if (current.length === 1) {
      setChapters([{ ...current[0], title: null, description: null }]);
      void saveChapter(chapterId, { title: null, contents: EMPTY_DESCRIPTION });
      return;
    }
    setChapters(current.filter((c) => c._id !== chapterId));
    enqueueSave(
      () => deleteChapterMutation({ variables: { chapterId: realId(chapterId) }, refetchQueries: [READING_CHAPTERS_QUERY] }),
      resyncFromServer,
    );
  }, [setChapters, saveChapter, enqueueSave, deleteChapterMutation, realId, resyncFromServer]);

  const moveChapter = useCallback((chapterId: string, direction: "up" | "down") => {
    const next = structure.moveChapter(chaptersRef.current, chapterId, direction);
    setChapters(next);
    saveChapterOrder(next);
  }, [setChapters, saveChapterOrder]);

  return {
    chapters,
    version,
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
