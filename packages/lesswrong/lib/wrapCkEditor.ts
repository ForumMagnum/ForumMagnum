import { ForumTypeString } from "./instanceSettings";

export const getCkEditor = (forumType: ForumTypeString) => {
  const ckEditor = bundleIsServer ? {} : require('../../../public/lesswrong-editor/build/ckeditor');

  const { EditorWatchdog, getCommentEditor, getPostEditor, getPostEditorCollaboration } = ckEditor;
  const CommentEditor = getCommentEditor(forumType)
  const PostEditor = getPostEditor(forumType)
  const PostEditorCollaboration = getPostEditorCollaboration(forumType)
  return { EditorWatchdog, CommentEditor, PostEditor, PostEditorCollaboration };
}

export const ckEditorBundleVersion = "32.0.1";
