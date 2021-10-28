// @ts-check
import FootnoteEditing from './footnoteediting';
import FootnoteUI from './footnoteui';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class Footnote extends Plugin {
    static get requires() {
        return [ FootnoteEditing, FootnoteUI ];
    }
}
