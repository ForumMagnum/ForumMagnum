import EditorWatchdog from '@ckeditor/ckeditor5-watchdog/src/editorwatchdog';
import { getCommentEditor, getPostEditor, getPostEditorCollaboration } from './ckeditor';

export const Editors = { getCommentEditor, getPostEditor, getPostEditorCollaboration, EditorWatchdog };
export default Editors;
