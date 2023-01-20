// @ts-check (uses JSDoc types for type checking)

/**
 * CKEditor dataview nodes can be converted to a output view or an editor view via downcasting
 *  * Upcasting is converting to the platonic ckeditor version.
 *  * Downcasting is converting to the output version.
 */
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import InsertButtonCommand from './insertButtonCommand';
import '../../theme/placeholder.css';
import RootElement from '@ckeditor/ckeditor5-engine/src/model/rootelement';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';

import { BUTTON_ELEMENT } from '../constants';
import { INSERT_BUTTON_COMMAND } from './constants';

export default class FootnoteEditing extends Plugin {
	static get requires() {
		return [ Widget, Autoformat ];
	}

	/**
	 * @type {RootElement} The root element of the document.
	 */
	get rootElement() {
		const rootElement = this.editor.model.document.getRoot();
		if(!rootElement) {
			throw new Error('Document has no rootElement element.');
		}
		return rootElement;
	}

	init() {
		const { schema } = this.editor.model;
		const { conversion } = this.editor;
		
		schema.register(BUTTON_ELEMENT, {
			isObject: true,
			allowIn: '$root',
		});


		// (model → editing view)
		conversion.for('editingDowncast').elementToElement({
			model: BUTTON_ELEMENT,
			view: (_, conversionApi) => {
				const viewWriter = conversionApi.writer;
				/** The below is a div rather than an ol because using an ol here caused weird behavior, including randomly duplicating the footnotes section.
				 *  This is techincally invalid HTML, but it's valid in the data view (that is, the version shown in the post). I've added role='list'
				 *  as a next-best option, in accordance with ARIA recommendations.
				 */
				const section = viewWriter.createContainerElement('div', { [ATTRIBUTES.footnoteSection]: '', role: 'doc-endnotes list', class: CLASSES.footnoteSection });

				return toWidget(section, viewWriter, { label: 'footnote widget' });
			}
		});


		this.editor.commands.add( INSERT_BUTTON_COMMAND, new InsertButtonCommand( this.editor ) );
	}

}
