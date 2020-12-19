const ckEditor = bundleIsServer ? {} : require('@lesswrong/lesswrong-editor');

const { EditorWatchdog, CommentEditor, PostEditor, PostEditorCollaboration } = ckEditor;
export { EditorWatchdog, CommentEditor, PostEditor, PostEditorCollaboration };

//export const EditorWatchdog = null;
//export const CommentEditor = null;
//export const PostEditor = null;
//export const PostEditorCollaboration = null;
