import type { ForumTypeString } from "@/lib/instanceSettings";
import ckEditor from '../../../public/lesswrong-editor/src/ckeditor-client';

export const getCkEditor = (forumType: ForumTypeString) => {
  const { getCommentEditor, getPostEditor, getPostEditorCollaboration } = ckEditor;
  return { getCommentEditor, getPostEditor, getPostEditorCollaboration };
}

