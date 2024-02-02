import { ForumTypeString } from "./instanceSettings";

export const getCkEditor = (forumType: ForumTypeString) => {
  const ckEditor = bundleIsServer ? {} : require('../../../public/lesswrong-editor/build/ckeditor');

  const { EditorWatchdog, CommentEditor, getPostEditor, getPostEditorCollaboration } = ckEditor;
  const PostEditor = getPostEditor(forumType)
  const PostEditorCollaboration = getPostEditorCollaboration(forumType)
  return { EditorWatchdog, CommentEditor, PostEditor, PostEditorCollaboration };
}

// TODO what to bump the version to and how to deploy
export const ckEditorBundleVersion = "31.0.15";

