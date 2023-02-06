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
			isLimit: true,
			isObject: true,
			allowedIn: '$root',
			allowWhere: '$block',
			allowChildren: '$text'
		});
		// (model → editing view)
		conversion.for('editingDowncast').elementToElement({
			model: BUTTON_ELEMENT,
			view: (modelElement, { writer }) => {
				console.log('modelElement', modelElement)
				console.log('attrs', modelElement.getAttributeKeys())
				console.log('href', modelElement.getAttribute('href'))
				const button = writer.createContainerElement('a', {
					class: BUTTON_CLASS,
					'data-button': true,
					'data-text': modelElement.getAttribute('data-text'),
					href: modelElement.getAttribute('href'), // TODO: sanitize?
				});
				const text = writer.createText(modelElement.getAttribute('text'));
				writer.insert(writer.createPositionAt(button, 0), text);

				return toWidget(button, writer, 'div');
			}
		});
		conversion.for('dataDowncast').elementToElement({
			model: BUTTON_ELEMENT,
			view: (modelElement, { writer }) => {
				console.log('dataDowncast attrs', modelElement.getAttributeKeys())
				const button = writer.createContainerElement('a', {
					class: BUTTON_CLASS,
					'data-button': true,
					'data-text': modelElement.getAttribute('data-text'),
					href: modelElement.getAttribute('href'), // TODO: sanitize?
				});
				const text = writer.createText(modelElement.getAttribute('text'));
				writer.insert(writer.createPositionAt(button, 0), text);

				return button;
			}
			// view: {
			// 	name: 'a',
			// 	class: BUTTON_CLASS,
			// 	attributes: ['data-button', 'data-text', 'href']
			// }
		});
		// (editing → model view)
		conversion.for('upcast').elementToElement({
			view: {
				name: 'a',
				class: BUTTON_CLASS,
				attributes: ['data-button', 'data-text', 'href']
			},
			model: ( viewElement, { writer } ) => {
				return writer.createElement(BUTTON_ELEMENT, {
					'data-button': true,
					'data-text': viewElement.getAttribute('data-text'),
					href: viewElement.getAttribute('href')
				});
			}
		});

		this.editor.commands.add( INSERT_BUTTON_COMMAND, new InsertButtonCommand( this.editor ) );
	}

}
