import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import { toWidget } from '@ckeditor/ckeditor5-widget/src/utils';
import InsertButtonCommand from './insertButtonCommand';
import RootElement from '@ckeditor/ckeditor5-engine/src/model/rootelement';
import './theme/customButton.css';

import { BUTTON_ELEMENT } from './constants';
import { INSERT_BUTTON_COMMAND } from './constants';
import { BUTTON_CLASS } from './constants';

export default class ButtonEditing extends Plugin {
	static get requires() {
		return [ Widget ];
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
			isBlock: true,
			isObject: true,
			allowIn: '$root',
			allowAttributes: [
				'data-button',
				'data-text',
				'data-href',
			],
		});
		// (model → editing view)
		conversion.for('editingDowncast').elementToElement({
			model: BUTTON_ELEMENT,
			view: (modelElement, { writer }) => {
				// console.log('modelElement', modelElement)
				// console.log('attrs', modelElement.getAttributeKeys())
				// const button = writer.createContainerElement('span', {
				// 	'data-button': true,
				// 	'data-text': modelElement.getAttribute('data-text'),
				// 	'data-href': modelElement.getAttribute('data-href'), // TODO: sanitize?
				// });
				// const innerSpan = writer.createContainerElement('sup', {
				// });
				// const link = writer.createContainerElement('a', {
				// 	class: BUTTON_CLASS,
				// 	href: modelElement.getAttribute('data-href'), // TODO: sanitize?
				// });

				// const text = writer.createText(modelElement.getAttribute('data-text'));
				// writer.insert(writer.createPositionAt(link, 0), text);
				// writer.insert(writer.createPositionAt(innerSpan, 0), link);
				// writer.insert(writer.createPositionAt(button, 0), innerSpan);
				const button = this.createButtonViewElement(modelElement, writer);

				return toWidget(button, writer);
			}
		});
		conversion.for('dataDowncast').elementToElement({
			model: BUTTON_ELEMENT,
			view: (modelElement, { writer }) => {
				// console.log('modelElement', modelElement)
				// console.log('attrs', modelElement.getAttributeKeys())
				// const button = writer.createContainerElement('span', {
				// 	'data-button': true,
				// 	'data-text': modelElement.getAttribute('data-text'),
				// 	'data-href': modelElement.getAttribute('data-href'), // TODO: sanitize?
				// });
				// const innerSpan = writer.createContainerElement('sup', {
				// });
				// const link = writer.createContainerElement('a', {
				// 	class: BUTTON_CLASS,
				// 	href: modelElement.getAttribute('data-href'), // TODO: sanitize?
				// });

				// const text = writer.createText(modelElement.getAttribute('data-text'));
				// writer.insert(writer.createPositionAt(link, 0), text);
				// writer.insert(writer.createPositionAt(innerSpan, 0), link);
				// writer.insert(writer.createPositionAt(button, 0), innerSpan);
				return this.createButtonViewElement(modelElement, writer);

				return button;
			}
			// view: {
			// 	name: 'a',
			// 	class: BUTTON_CLASS,
			// 	attributes: ['data-button', 'data-text', 'data-href']
			// }
		});
		// (editing → model view)
		conversion.for('upcast').elementToElement({
			view: {
				attributes: {
					'data-button': true,
				},
			},
			model: ( viewElement, { writer } ) => {
				return writer.createElement(BUTTON_ELEMENT, {
					'data-button': true,
					'data-text': viewElement.getAttribute('data-text'),
					'data-href': viewElement.getAttribute('data-href')
				});
			}
		});

		this.editor.commands.add( INSERT_BUTTON_COMMAND, new InsertButtonCommand( this.editor ) );
	}
	
	createButtonViewElement(modelElement, viewWriter) {
		const index = '10'
		const id = 'whatever'
		if(index === undefined) {
			throw new Error('Footnote reference has no provided index.')
		}
		if(id === undefined) {
			throw new Error('Footnote reference has no provided id.')
		}

		const footnoteReferenceView = viewWriter.createContainerElement('span', {
			'data-button': true,
			'data-text': 'test',
			'data-href': 'test',
		});

		const innerText = viewWriter.createText(`[${index}]`);
		const link = viewWriter.createContainerElement('a', {href: `#fn${id}`});
		const superscript = viewWriter.createContainerElement('sup');
		viewWriter.insert(viewWriter.createPositionAt(link, 0), innerText);
		viewWriter.insert(viewWriter.createPositionAt(superscript, 0), link);
		viewWriter.insert(viewWriter.createPositionAt(footnoteReferenceView, 0), superscript);

		return footnoteReferenceView;
	}
}
