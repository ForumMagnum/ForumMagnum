// @ts-check (uses JSDoc types for type checking)

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
import { ATTRIBUTES, CLASSES, ELEMENTS } from '../constants';

/**
 * Defines methods for converting between model, data view, and editing view representations of each element type.
g * @param {Editor} editor
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
			attributes: {
				[ATTRIBUTES.footnoteSection]: true,
			},
		},
		model: (_, conversionApi) => {
			const modelWriter = conversionApi.writer;
			const Footnote = modelWriter.createElement(ELEMENTS.footnoteSection);
			return Footnote;
		}

	});

	// (model → data view)
	conversion.for('dataDowncast').elementToElement({
		model: ELEMENTS.footnoteSection,
		view: {
			name: 'section',
			attributes: {[ATTRIBUTES.footnoteSection]: ''},
			classes: [CLASSES.footnoteSection, 'footnotes'],
		}
	});

	// (model → editing view)
	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.footnoteSection,
		view: (_, conversionApi) => {
			const viewWriter = conversionApi.writer;
			const section = viewWriter.createContainerElement('section', { [ATTRIBUTES.footnoteSection]: '', class: CLASSES.footnoteSection });

			return toWidget(section, viewWriter, { label: 'footnote widget' });
		}
	});

	/***********************************Footnote List Conversion************************************/

	conversion.for('upcast').elementToElement({
		model: (_, conversionApi) => {
			const modelWriter = conversionApi.writer;
			return modelWriter.createElement(ELEMENTS.footnoteList);
		},
		view: {
			name: 'section',
			attributes: {
				[ATTRIBUTES.footnoteList]: true,
			},
		}
	});

	conversion.for('dataDowncast').elementToElement({
		model: ELEMENTS.footnoteList,
		view: {
			name: 'section',
			attributes: {[ATTRIBUTES.footnoteList]: ''},
			classes: [CLASSES.footnoteList],
		}
	});

	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.footnoteList,
		view: (_, conversionApi) => {
			const viewWriter = conversionApi.writer;
			// Note: You use a more specialized createEditableElement() method here.
			const section = viewWriter.createEditableElement('section', { [ATTRIBUTES.footnoteList] : '', class: CLASSES.footnoteList });

			return toWidgetEditable(section, viewWriter);
		}
	});

	/***********************************Footnote Item Conversion************************************/

	conversion.for('upcast').elementToElement({
		view: {
			name: 'span',
			attributes: {
				[ATTRIBUTES.footnoteIte]: true,
			},
		},
		model: (viewElement, conversionApi) => {
			const modelWriter = conversionApi.writer;
			const id = viewElement.getAttribute(ATTRIBUTES.footnoteId);
			if(!id) {
				return null;
			}

			return modelWriter.createElement(ELEMENTS.footnoteItem, { [ATTRIBUTES.footnoteId]: id });
		}
	});

	conversion.for('dataDowncast').elementToElement({
		model: ELEMENTS.footnoteItem,
		view: createFootnoteItemViewElement
	});

	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.footnoteItem,

		view: (modelElement, conversionApi) => {
			const viewWriter = conversionApi.writer;
			// @ts-ignore -- The type declaration for DowncastHelpers#elementToElement is incorrect. It expects
			// a view Element where it should expect a model Element.
			const itemView = createFootnoteItemViewElement(modelElement, conversionApi);
			return toWidget(itemView, viewWriter);
		}
	});

	/***********************************Footnote Inline Conversion************************************/

	conversion.for('upcast').elementToElement({
		view: {
			name: 'span',
			attributes: {
				[ATTRIBUTES.footnoteReference]: true,
			},
		},
		model: (viewElement, conversionApi) => {
			const modelWriter = conversionApi.writer;
			const id = viewElement.getAttribute(ATTRIBUTES.footnoteId);
			if(id === undefined) {
				return null;
			}

			return modelWriter.createElement(
				ELEMENTS.footnoteReference, 
				{
					[ATTRIBUTES.footnoteReference]: '',
					[ATTRIBUTES.footnoteId]: id,
				});
		}
	});

	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.footnoteReference,
		view: (modelElement, conversionApi) => {
			const viewWriter = conversionApi.writer;
			// @ts-ignore -- The type declaration for DowncastHelpers#elementToElement is incorrect. It expects
			// a view Element where it should expect a model Element.
			const footnoteReferenceViewElement = createFootnoteReferenceViewElement(modelElement, conversionApi);
			return toWidget(footnoteReferenceViewElement, viewWriter);
		},
	});

	conversion.for('dataDowncast').elementToElement({
		model: ELEMENTS.footnoteReference,
		view: createFootnoteReferenceViewElement,
	});

	conversion.for('editingDowncast')
		.add(dispatcher => {
			dispatcher.on(
				`attribute:${ATTRIBUTES.footnoteId}:${ELEMENTS.footnoteItem}`,
				(_, data, conversionApi) => updateReferences(data, conversionApi, editor, rootElement),
				{ priority: 'high' });
			dispatcher.on(
				`attribute:${ATTRIBUTES.footnoteId}:${ELEMENTS.footnoteItem}`, 
				(_, data, conversionApi) => updateFootnoteItemView(data, conversionApi, editor), 
				{ priority: 'high' });
			dispatcher.on(
				`attribute:${ATTRIBUTES.footnoteId}:${ELEMENTS.footnoteReference}`, 
				(_, data, conversionApi) => updateFootnoteReferenceView(data, conversionApi, editor), 
				{ priority: 'high' }
			);
		});
}

/**
 * Creates and returns a view element for a footnote reference.
 * @param {ModelElement} viewElement
 * @param {DowncastConversionApi} conversionApi
 * @returns {ContainerElement}
 */
const createFootnoteReferenceViewElement = (viewElement, conversionApi) => {
	const viewWriter = conversionApi.writer;
	const id = viewElement.getAttribute(ATTRIBUTES.footnoteId);
	if(id === undefined) {
		throw new Error('Footnote reference has no provided Id.')
	}

	const footnoteReferenceView = viewWriter.createContainerElement('span', {
		class: ELEMENTS.footnoteReference,
		[ATTRIBUTES.footnoteReference]: '',
		[ATTRIBUTES.footnoteId]: id,
	});

	const innerText = viewWriter.createText(`[${id}]`);
	const link = viewWriter.createContainerElement('a', {href: `#fn${id}`});
	const superscript = viewWriter.createContainerElement('sup');
	viewWriter.insert(viewWriter.createPositionAt(link, 0), innerText);
	viewWriter.insert(viewWriter.createPositionAt(superscript, 0), link);
	viewWriter.insert(viewWriter.createPositionAt(footnoteReferenceView, 0), superscript);

	return footnoteReferenceView;
}

/**
 * Creates and returns a view element for a footnote item.
 * @param {ModelElement} modelElement
 * @param {DowncastConversionApi} conversionApi
 * @returns {ContainerElement}
 */
const createFootnoteItemViewElement = (modelElement, conversionApi) => {
	const viewWriter = conversionApi.writer;
	const id = modelElement.getAttribute(ATTRIBUTES.footnoteId);
	if(!id) {
		throw new Error('Footnote reference has no provided Id.')
	}

	const itemView = viewWriter.createContainerElement('span', {
		[ATTRIBUTES.footnoteItem]: '',
		[ATTRIBUTES.footnoteId]: id,
		class: CLASSES.footnoteItem,
		id: `fn${id}`,
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
 * Updates all references for a single footnote. This function is called when
 * the id of an existing footnote changes.
 * @param {Data} data provides the old and new values of the changed attribute.
 * @param {DowncastConversionApi} conversionApi
 * @param {Editor} editor
 * @param {RootElement} rootElement
 * @returns
 */
const updateReferences = (data, conversionApi, editor, rootElement) => {
	const { item, attributeOldValue, attributeNewValue } = data;
	if (!(item instanceof ModelElement) || !conversionApi.consumable.consume(item, `attribute:${ATTRIBUTES.footnoteId}:${ELEMENTS.footnoteItem}`)) {
		return;
	}

	if (attributeOldValue === null || attributeNewValue === null || !item) {
		return;
	}

	const footnoteReferences = modelQueryElementsAll(
		editor, 
		rootElement, 
		e => e.name === ELEMENTS.footnoteReference && e.getAttribute(ATTRIBUTES.footnoteId) === attributeOldValue
	);
	footnoteReferences.forEach(footnoteReference => {
		editor.model.enqueueChange(writer => {
			writer.setAttribute(ATTRIBUTES.footnoteId, data.attributeNewValue, footnoteReference);
		});
	});
}

/**
 * @param {Data} data
 * @param {DowncastConversionApi} conversionApi
 * @param {Editor} editor
 * @returns
 */
const updateFootnoteItemView = (data, conversionApi, editor) => {
	const { item, attributeOldValue, attributeNewValue } = data;
	conversionApi.consumable.add(item, `attribute:${ATTRIBUTES.footnoteId}:${ELEMENTS.footnoteItem}`);
	if (!(item instanceof ModelElement) || !conversionApi.consumable.consume(item, `attribute:${ATTRIBUTES.footnoteId}:${ELEMENTS.footnoteItem}`)) {
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
	viewWriter.setAttribute(ATTRIBUTES.footnoteId, attributeNewValue.toString(), itemView);
}

/**
 * @param {Data} data
 * @param {DowncastConversionApi} conversionApi
 * @param {Editor} editor
 * @returns
 */
const updateFootnoteReferenceView = (data, conversionApi, editor) => {
	const { item, attributeOldValue, attributeNewValue } = data;
	if (!(item instanceof ModelElement) || !conversionApi.consumable.consume(item, `attribute:${ATTRIBUTES.footnoteId}:${ELEMENTS.footnoteReference}`)) {
		return;
	}

	const footnoteReferenceView = conversionApi.mapper.toViewElement(item);

	if (attributeOldValue === null || !footnoteReferenceView) {
		return;
	}

	const viewWriter = conversionApi.writer;

	const textNode = viewQueryText(editor, footnoteReferenceView, (_) => true);
	const anchor = viewQueryElement(editor, footnoteReferenceView, element => element.name === 'a');

	if(!textNode || !anchor){
		viewWriter.remove(footnoteReferenceView);
		return;
	}

	viewWriter.remove(textNode);
	const innerText = viewWriter.createText(`[${attributeNewValue.toString()}]`);
	viewWriter.insert(viewWriter.createPositionAt(anchor, 0), innerText);

	viewWriter.setAttribute('href', `fn${attributeNewValue}`, anchor);
}
