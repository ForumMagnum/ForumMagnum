
export const getCkEditor = () => {
  const ckEditor = bundleIsServer ? {} : require('../../../public/lesswrong-editor/build/ckeditor');
  
  const { EditorWatchdog, CommentEditor, PostEditor, PostEditorCollaboration } = ckEditor;
  return { EditorWatchdog, CommentEditor, PostEditor, PostEditorCollaboration };
}

export const ckEditorBundleVersion = "31.0.5";

