import type { ForumTypeString } from "@/lib/instanceSettings";
// @ts-ignore
import { getCommentEditor, getPostEditor, getPostEditorCollaboration } from '../../../public/lesswrong-editor/build/ckeditor';

export const getCkEditor = (forumType: ForumTypeString) => {
  return { getCommentEditor, getPostEditor, getPostEditorCollaboration };
}

