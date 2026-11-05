import 'ckeditor5/ckeditor5.css';
// Per-package rather than the ckeditor5-premium-features aggregate, which is
// mostly styles for premium features we don't use. When adding a premium
// plugin to ckeditor.ts, add its package's stylesheet here.
import '@ckeditor/ckeditor5-collaboration-core/dist/index.css';
import '@ckeditor/ckeditor5-comments/dist/index.css';
import '@ckeditor/ckeditor5-real-time-collaboration/dist/index.css';
import '@ckeditor/ckeditor5-track-changes/dist/index.css';
import { getCommentEditor, getPostEditor, getPostEditorCollaboration } from './ckeditor';

export const Editors = { getCommentEditor, getPostEditor, getPostEditorCollaboration };
export default Editors;
