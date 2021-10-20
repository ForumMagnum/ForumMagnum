import FootNoteEditing from './footnoteediting';
import FootNoteUI from './footnoteui';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class FootNote extends Plugin {
    static get requires() {
        return [ FootNoteEditing, FootNoteUI ];
    }
}