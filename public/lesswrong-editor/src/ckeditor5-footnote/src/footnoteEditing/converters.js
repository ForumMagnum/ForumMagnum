// @ts-check
import { Editor } from '@ckeditor/ckeditor5-core';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import ContainerElement from '@ckeditor/ckeditor5-engine/src/view/containerelement';
import { DowncastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/downcastdispatcher';
import ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';
import ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import RootElement from '@ckeditor/ckeditor5-engine/src/model/rootelement';
import TextProxy from '@ckeditor/ckeditor5-engine/src/model/textproxy';
import Node from '@ckeditor/ckeditor5-engine/src/model/node';
import { modelQueryElementsAll, viewQueryElement, viewQueryText } from '../utils';

/**
 * @param {Editor} editor
 * @param {RootElement} rootElement
 * @returns {void}
 * */
export const defineConverters = (editor, rootElement) => {
	const conversion = editor.conversion;

	/***********************************Footnote Section Conversion************************************/
	// ((data) view → model)
	conversion.for('upcast').elementToElement({
		view: {
			name: 'section',
			classes: 'footnote-section'
		},
		model: (_, conversionApi) => {
			const modelWriter = conversionApi.writer;
			const Footnote = modelWriter.createElement('footnoteSection');
			return Footnote;
		}

	});

	// (model → data view)
	conversion.for('dataDowncast').elementToElement({
		model: 'footnoteSection',
		view: {
			name: 'section',
			classes: ['footnote-section', 'footnotes'],
		}
	});

	// (model → editing view)
	conversion.for('editingDowncast').elementToElement({
		model: 'footnoteSection',
		view: (modelElement, conversionApi) => {
			const viewWriter = conversionApi.writer;
			const section = viewWriter.createContainerElement('section', { class: 'footnote-section' });

			return toWidget(section, viewWriter, { label: 'footnote widget' });
		}
	});

	/***********************************Footnote List Conversion************************************/

	conversion.for('upcast').elementToElement({
		model: (_, conversionApi) => {
			const modelWriter = conversionApi.writer;
			return modelWriter.createElement('footnoteList');
		},
		view: {
			name: 'section',
			classes: 'footnote-list',
		}
	});

	conversion.for('dataDowncast').elementToElement({
		model: 'footnoteList',
		view: {
			name: 'section',
			classes: 'footnote-list',
		}
	});

	conversion.for('editingDowncast').elementToElement({
		model: 'footnoteList',
		view: (_, conversionApi) => {
			const viewWriter = conversionApi.writer;
			// Note: You use a more specialized createEditableElement() method here.
			const section = viewWriter.createEditableElement('section', { class: 'footnote-list' });

			return toWidgetEditable(section, viewWriter);
		}
	});

	/***********************************Footnote Item Conversion************************************/

	conversion.for('upcast').elementToElement({
		view: {
			name: 'span',
			classes: 'footnote-item',
		},
		model: (viewElement, conversionApi) => {
			const modelWriter = conversionApi.writer;
			const id = viewElement.getAttribute('data-footnote-id');
			if(!id) {
				return null;
			}

			return modelWriter.createElement('footnoteItem', { 'data-footnote-id': id });
		}
	});

	conversion.for('dataDowncast').elementToElement({
		model: 'footnoteItem',
		view: createItemView
	});

	conversion.for('editingDowncast').elementToElement({
		model: 'footnoteItem',
		view: (modelElement, conversionApi) => {
			const viewWriter = conversionApi.writer;
			// @ts-ignore -- The type declaration for DowncastHelpers#elementToElement is incorrect. It expects
			// a view Element where it should expect a model Element.
			const itemView = createItemView(modelElement, conversionApi);
			return toWidget(itemView, viewWriter);
		}
	});

	/***********************************Footnote Inline Conversion************************************/

	conversion.for('upcast').elementToElement({
		view: {
			name: 'span',
			classes: [ 'noteholder' ]
		},
		model: (viewElement, conversionApi) => {
			const modelWriter = conversionApi.writer;
			const id = viewElement.getAttribute('data-footnote-id');
			if(id === undefined) {
				return null;
			}

			return modelWriter.createElement('noteHolder', { 'data-footnote-id': id });
		}
	});

	conversion.for('editingDowncast').elementToElement({
		model: 'noteHolder',
		view: (viewElement, conversionApi) => {
			const viewWriter = conversionApi.writer;
			const placeholderView = createPlaceholderView(viewElement, conversionApi);
			return toWidget(placeholderView, viewWriter);
		},
	});

	conversion.for('dataDowncast').elementToElement({
		model: 'noteHolder',
		view: createPlaceholderView,
	});

	conversion.for('editingDowncast')
		.add(dispatcher => {
			dispatcher.on(
				'attribute:data-footnote-id:footnoteItem',
				(_, data, conversionApi) => updateReferences(data, conversionApi, editor, rootElement),
				{ priority: 'high' });
			dispatcher.on(
				'attribute:data-footnote-id:footnoteItem', 
				(_, data, conversionApi) => modelViewChangeItem(data, conversionApi, editor), 
				{ priority: 'high' });
			dispatcher.on(
				'attribute:data-footnote-id:noteHolder', 
				(_, data, conversionApi) => modelViewChangeHolder(data, conversionApi, editor), 
				{ priority: 'high' }
			);
		});

}

/**
 * @param {ViewElement} viewElement
 * @param {DowncastConversionApi} conversionApi
 * @returns {ContainerElement}
 */
const createPlaceholderView = (viewElement, conversionApi) => {
	const viewWriter = conversionApi.writer;
	const id = viewElement.getAttribute('data-footnote-id');
	if(id === undefined) {
		throw new Error('Note Holder has no provided Id.')
	}

	const placeholderView = viewWriter.createContainerElement('span', {
		class: 'noteholder',
		'data-footnote-id': id,
	});

	// Insert the placeholder name (as a text).
	const innerText = viewWriter.createText(`[${id}]`);
	const link = viewWriter.createContainerElement('a', {href: `#fn${id}`});
	const superscript = viewWriter.createContainerElement('sup');
	viewWriter.insert(viewWriter.createPositionAt(link, 0), innerText);
	viewWriter.insert(viewWriter.createPositionAt(superscript, 0), link);
	viewWriter.insert(viewWriter.createPositionAt(placeholderView, 0), superscript);

	return placeholderView;
}

/**
 *
 * @param {Element} modelElement
 * @param {DowncastConversionApi} conversionApi
 * @returns {ContainerElement}
 */
const createItemView = (modelElement, conversionApi) => {
	const viewWriter = conversionApi.writer;
	const id = modelElement.getAttribute('data-footnote-id');
	if(!id) {
		throw new Error('Note Holder has no provided Id.')
	}

	const itemView = viewWriter.createContainerElement('span', {
		class: 'footnote-item',
		id: `fn${id}`,
		'data-footnote-id': id,
	});

	const innerText = viewWriter.createText(id + '. ');
	viewWriter.insert(viewWriter.createPositionAt(itemView, 0), innerText);

	return itemView;
}

/**
 * @typedef {Object} Data
 * @property {Node | TextProxy} item
 * @property {string} attributeOldValue
 * @property {string} attributeNewValue
 */

/**
 * @param {Data} data
 * @param {DowncastConversionApi} conversionApi
 * @param {Editor} editor
 * @param {RootElement} rootElement
 * @returns
 */
const updateReferences = (data, conversionApi, editor, rootElement) => {
	const { item, attributeOldValue, attributeNewValue } = data;
	if (!(item instanceof ModelElement) || !conversionApi.consumable.consume(item, 'attribute:data-footnote-id:footnoteItem')) {
		return;
	}

	if (attributeOldValue === null || attributeNewValue === null || !item) {
		return;
	}

	const noteHolders = modelQueryElementsAll(
		editor, 
		rootElement, 
		e => e.name === 'noteHolder' && e.getAttribute('data-footnote-id') === attributeOldValue
	);
	noteHolders.forEach(noteHolder => {
		editor.model.enqueueChange(writer => {
			writer.setAttribute('data-footnote-id', data.attributeNewValue, noteHolder);
		});
	});
}

/**
 * @param {Data} data
 * @param {DowncastConversionApi} conversionApi
 * @param {Editor} editor
 * @returns
 */
const modelViewChangeItem = (data, conversionApi, editor) => {
	const { item, attributeOldValue, attributeNewValue } = data;
	conversionApi.consumable.add(item, 'attribute:data-footnote-id:footnoteItem');
	if (!(item instanceof ModelElement) || !conversionApi.consumable.consume(item, 'attribute:data-footnote-id:footnoteItem')) {
		return;
	}

	const itemView = conversionApi.mapper.toViewElement(item);

	if (attributeOldValue === null || !itemView) {
		return;
	}
	const textNode = viewQueryText(editor, itemView, _ => true);

	const viewWriter = conversionApi.writer;

	if(!textNode){
		return;
	}

	const parent = textNode.parent;
	if(!parent || !(parent instanceof ViewElement)) {
		return;
	}
	viewWriter.remove(textNode);


	const innerText = viewWriter.createText(attributeNewValue + '. ');
	viewWriter.insert(viewWriter.createPositionAt(parent, 0), innerText);
	const newHref = `fn${attributeNewValue}`;
	viewWriter.setAttribute('id', newHref, itemView);
	viewWriter.setAttribute('data-attribute-id', attributeNewValue.toString(), itemView);
}

/**
 * @param {Data} data
 * @param {DowncastConversionApi} conversionApi
 * @param {Editor} editor
 * @returns
 */
const modelViewChangeHolder = (data, conversionApi, editor) => {
	const { item, attributeOldValue, attributeNewValue } = data;
	if (!(item instanceof ModelElement) || !conversionApi.consumable.consume(item, 'attribute:data-footnote-id:noteHolder')) {
		return;
	}

	const noteHolderView = conversionApi.mapper.toViewElement(item);

	if (attributeOldValue === null || !noteHolderView) {
		return;
	}

	const viewWriter = conversionApi.writer;

	const textNode = viewQueryText(editor, noteHolderView, (_) => true);
	const anchor = viewQueryElement(editor, noteHolderView, element => element.name === 'a');

	if(!textNode || !anchor){
		viewWriter.remove(noteHolderView);
		return;
	}

	viewWriter.remove(textNode);
	const innerText = viewWriter.createText(`[${attributeNewValue.toString()}]`);
	viewWriter.insert(viewWriter.createPositionAt(anchor, 0), innerText);

	viewWriter.setAttribute('href', `fn${attributeNewValue}`, anchor);
}
