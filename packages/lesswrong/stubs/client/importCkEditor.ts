import type { ForumTypeString } from "@/lib/instanceSettings";

export const getCkEditor = (forumType: ForumTypeString) => {
  return { EditorWatchdog: null, getCommentEditor: null, getPostEditor: null, getPostEditorCollaboration : null};
}

