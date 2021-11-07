
export const getCkEditor = () => {
  //const ckEditor = bundleIsServer ? {} : require('@lesswrong/lesswrong-editor');
  const ckEditor = require('@lesswrong/lesswrong-editor');
  
  const { EditorWatchdog, CommentEditor, PostEditor, PostEditorCollaboration } = ckEditor;
  return { EditorWatchdog, CommentEditor, PostEditor, PostEditorCollaboration };
}
