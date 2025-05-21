// @ts-check (uses JSDoc types for type checking)

/* Adapted from https://github.com/Precise-software/ckeditor5-footnote */

import FootnoteEditing from './footnoteEditing/footnoteEditing';
import FootnoteUI from './footnoteui';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class Footnote extends Plugin {
	static get requires() {
		return [ FootnoteEditing, FootnoteUI ];
	}
}
