import type { ForumTypeString } from "@/lib/instanceSettings";
import ckEditor from '../../../ckEditor/src/ckeditor-client';

export const getCkEditor = (forumType: ForumTypeString) => {
  const { getCommentEditor, getPostEditor, getPostEditorCollaboration } = ckEditor;
  return { getCommentEditor, getPostEditor, getPostEditorCollaboration };
}

