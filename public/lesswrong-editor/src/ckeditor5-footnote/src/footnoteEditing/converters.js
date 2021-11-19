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
import { CLASSES, DATA_FOOTNOTE_ID, ELEMENTS } from '../constants';

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
			classes: CLASSES.footnoteSection
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
			classes: [CLASSES.footnoteSection, 'footnotes'],
		}
	});

	// (model → editing view)
	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.footnoteSection,
		view: (modelElement, conversionApi) => {
			const viewWriter = conversionApi.writer;
			const section = viewWriter.createContainerElement('section', { class: CLASSES.footnoteSection });

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
			classes: CLASSES.footnoteList,
		}
	});

	conversion.for('dataDowncast').elementToElement({
		model: ELEMENTS.footnoteList,
		view: {
			name: 'section',
			classes: CLASSES.footnoteList,
		}
	});

	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.footnoteList,
		view: (_, conversionApi) => {
			const viewWriter = conversionApi.writer;
			// Note: You use a more specialized createEditableElement() method here.
			const section = viewWriter.createEditableElement('section', { class: CLASSES.footnoteList });

			return toWidgetEditable(section, viewWriter);
		}
	});

	/***********************************Footnote Item Conversion************************************/

	conversion.for('upcast').elementToElement({
		view: {
			name: 'span',
			classes: CLASSES.footnoteItem,
		},
		model: (viewElement, conversionApi) => {
			const modelWriter = conversionApi.writer;
			const id = viewElement.getAttribute(DATA_FOOTNOTE_ID);
			if(!id) {
				return null;
			}

			return modelWriter.createElement(ELEMENTS.footnoteItem, { [DATA_FOOTNOTE_ID]: id });
		}
	});

	conversion.for('dataDowncast').elementToElement({
		model: ELEMENTS.footnoteItem,
		view: createItemView
	});

	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.footnoteItem,
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
			classes: [ ELEMENTS.footnoteReference ]
		},
		model: (viewElement, conversionApi) => {
			const modelWriter = conversionApi.writer;
			const id = viewElement.getAttribute(DATA_FOOTNOTE_ID);
			if(id === undefined) {
				return null;
			}

			return modelWriter.createElement(ELEMENTS.footnoteReference, { [DATA_FOOTNOTE_ID]: id });
		}
	});

	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.footnoteReference,
		view: (viewElement, conversionApi) => {
			const viewWriter = conversionApi.writer;
			const placeholderView = createPlaceholderView(viewElement, conversionApi);
			return toWidget(placeholderView, viewWriter);
		},
	});

	conversion.for('dataDowncast').elementToElement({
		model: ELEMENTS.footnoteReference,
		view: createPlaceholderView,
	});

	conversion.for('editingDowncast')
		.add(dispatcher => {
			dispatcher.on(
				`attribute:${DATA_FOOTNOTE_ID}:${ELEMENTS.footnoteItem}`,
				(_, data, conversionApi) => updateReferences(data, conversionApi, editor, rootElement),
				{ priority: 'high' });
			dispatcher.on(
				`attribute:${DATA_FOOTNOTE_ID}:${ELEMENTS.footnoteItem}`, 
				(_, data, conversionApi) => modelViewChangeItem(data, conversionApi, editor), 
				{ priority: 'high' });
			dispatcher.on(
				`attribute:${DATA_FOOTNOTE_ID}:${ELEMENTS.footnoteReference}`, 
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
	const id = viewElement.getAttribute(DATA_FOOTNOTE_ID);
	if(id === undefined) {
		throw new Error('Footnote reference has no provided Id.')
	}

	const placeholderView = viewWriter.createContainerElement('span', {
		class: ELEMENTS.footnoteReference,
		[DATA_FOOTNOTE_ID]: id,
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
	const id = modelElement.getAttribute(DATA_FOOTNOTE_ID);
	if(!id) {
		throw new Error('Footnote reference has no provided Id.')
	}

	const itemView = viewWriter.createContainerElement('span', {
		class: CLASSES.footnoteItem,
		id: `fn${id}`,
		[DATA_FOOTNOTE_ID]: id,
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
	if (!(item instanceof ModelElement) || !conversionApi.consumable.consume(item, `attribute:${DATA_FOOTNOTE_ID}:${ELEMENTS.footnoteItem}`)) {
		return;
	}

	if (attributeOldValue === null || attributeNewValue === null || !item) {
		return;
	}

	const footnoteReferences = modelQueryElementsAll(
		editor, 
		rootElement, 
		e => e.name === ELEMENTS.footnoteReference && e.getAttribute(DATA_FOOTNOTE_ID) === attributeOldValue
	);
	footnoteReferences.forEach(footnoteReference => {
		editor.model.enqueueChange(writer => {
			writer.setAttribute(DATA_FOOTNOTE_ID, data.attributeNewValue, footnoteReference);
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
	conversionApi.consumable.add(item, `attribute:${DATA_FOOTNOTE_ID}:${ELEMENTS.footnoteItem}`);
	if (!(item instanceof ModelElement) || !conversionApi.consumable.consume(item, `attribute:${DATA_FOOTNOTE_ID}:${ELEMENTS.footnoteItem}`)) {
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
	if (!(item instanceof ModelElement) || !conversionApi.consumable.consume(item, `attribute:${DATA_FOOTNOTE_ID}:${ELEMENTS.footnoteReference}`)) {
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
