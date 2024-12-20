import type { ForumTypeString } from "@/lib/instanceSettings";

export const getCkEditor = (forumType: ForumTypeString) => {
  const ckEditor = bundleIsServer ? {} : require(`../../../ckEditor/build/ckeditor`);
  const { getCommentEditor, getPostEditor, getPostEditorCollaboration } = ckEditor;
  return { getCommentEditor, getPostEditor, getPostEditorCollaboration };
}

