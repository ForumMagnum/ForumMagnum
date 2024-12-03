import type { ForumTypeString } from "@/lib/instanceSettings";
// @ts-ignore
// import { getCommentEditor, getPostEditor, getPostEditorCollaboration } from '../../../public/lesswrong-editor/build/ckeditor';

export const getCkEditor = (forumType: ForumTypeString) => {
  const ckEditor = bundleIsServer ? {} : require(`../../../public/lesswrong-editor/build/ckeditor`);
  const { getCommentEditor, getPostEditor, getPostEditorCollaboration } = ckEditor;
  return { getCommentEditor, getPostEditor, getPostEditorCollaboration };
}

