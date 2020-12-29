import { EditorWatchdog, CommentEditor, PostEditor, PostEditorCollaboration } from '@lesswrong/lesswrong-editor';

export const getCkEditor = () => {
  return { EditorWatchdog, CommentEditor, PostEditor, PostEditorCollaboration };
}
