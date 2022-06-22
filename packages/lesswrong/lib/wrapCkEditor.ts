
export const getCkEditor = () => {
  const ckEditor = bundleIsServer ? {} : require('../../../public/lesswrong-editor/src/ckeditor');
  
  const { EditorWatchdog, CommentEditor, PostEditor, PostEditorCollaboration } = ckEditor;
  return { EditorWatchdog, CommentEditor, PostEditor, PostEditorCollaboration };
}
