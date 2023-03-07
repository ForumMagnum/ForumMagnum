
export const getCkEditor = (forumType) => {
  const ckEditor = bundleIsServer ? {} : require('../../../public/lesswrong-editor/build/ckeditor');
  
  const { EditorWatchdog, CommentEditor, getPostEditor, getPostEditorCollaboration } = ckEditor;
  const PostEditor = getPostEditor(forumType)
  const PostEditorCollaboration = getPostEditorCollaboration(forumType)
  return { EditorWatchdog, CommentEditor, PostEditor, PostEditorCollaboration };
}

export const ckEditorBundleVersion = "35.0.1";

