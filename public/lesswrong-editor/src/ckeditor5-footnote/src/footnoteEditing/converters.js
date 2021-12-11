// @ts-check (uses JSDoc types for type checking)

import { Editor } from '@ckeditor/ckeditor5-core';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import ContainerElement from '@ckeditor/ckeditor5-engine/src/view/containerelement';
import { DowncastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/downcastdispatcher';
import ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';
import TextProxy from '@ckeditor/ckeditor5-engine/src/view/textproxy';
import RootElement from '@ckeditor/ckeditor5-engine/src/model/rootelement';
import { modelQueryElementsAll, viewQueryElement, viewQueryText } from '../utils';
import { ATTRIBUTES, CLASSES, ELEMENTS } from '../constants';

/**
 * Defines methods for converting between model, data view, and editing view representations of each element type.
 * @param {Editor} editor
 * @param {RootElement} rootElement
 * @returns {void}
 * */
export const defineConverters = (editor, rootElement) => {
	const conversion = editor.conversion;

	/***********************************Attribute Conversion************************************/

	conversion.for('downcast').attributeToAttribute({
		model: ATTRIBUTES.footnoteId,
		view: ATTRIBUTES.footnoteId,
	})

	/***********************************Footnote Section Conversion************************************/
	// ((data) view → model)
	conversion.for('upcast').elementToElement({
		view: {
			attributes: {
				[ATTRIBUTES.footnoteSection]: true,
			},
		},
		model: ELEMENTS.footnoteSection,
	});

	// (model → data view)
	conversion.for('dataDowncast').elementToElement({
		model: ELEMENTS.footnoteSection,
		view: {
			name: 'ol',
			attributes: {[ATTRIBUTES.footnoteSection]: ''},
			classes: [CLASSES.footnoteSection, CLASSES.footnotes],
		}
	});

	// (model → editing view)
	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.footnoteSection,
		view: (_, conversionApi) => {
			const viewWriter = conversionApi.writer;
			/** The below is a div rather than an ol because using an ol here caused weird behavior, including randomly duplicating the footnotes section.
			 *  This is techincally invalid HTML, but it's valid in the data view (that is, the version shown in the post). I've added role='list'
			 *  as a next-best option, in accordance with ARIA recommendations.
			 */ 
			const section = viewWriter.createContainerElement('div', { [ATTRIBUTES.footnoteSection]: '', role: 'list', class: CLASSES.footnoteSection });

			return toWidget(section, viewWriter, { label: 'footnote widget' });
		}
	});

	/***********************************Footnote Content Conversion************************************/

	conversion.for('upcast').elementToElement({
		view: {
			attributes: {
				[ATTRIBUTES.footnoteContent]: true,
			},
		},
		model: ELEMENTS.footnoteContent,
	});

	conversion.for('dataDowncast').elementToElement({
		model: ELEMENTS.footnoteContent,
		view: {
			name: 'div',
			attributes: {[ATTRIBUTES.footnoteContent]: ''},
			classes: [CLASSES.footnoteContent],
		}
	});

	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.footnoteContent,
		view: (_, conversionApi) => {
			const viewWriter = conversionApi.writer;
			// Note: You use a more specialized createEditableElement() method here.
			const section = viewWriter.createEditableElement('div', { [ATTRIBUTES.footnoteContent] : '', class: CLASSES.footnoteContent });

			return toWidgetEditable(section, viewWriter);
		}
	});

	/***********************************Footnote Item Conversion************************************/

	conversion.for('upcast').elementToElement({
		view: {
			attributes: {
				[ATTRIBUTES.footnoteItem]: true,
			},
		},
		model: (viewElement, conversionApi) => {
			const modelWriter = conversionApi.writer;
			const id = viewElement.getAttribute(ATTRIBUTES.footnoteId);
			if(id === undefined) {
				return null;
			}

			return modelWriter.createElement(
				ELEMENTS.footnoteItem, 
				{
					[ATTRIBUTES.footnoteId]: id,
				});
		},
		/** converterPriority is needed to supersede the builtin upcastListItemStyle 
		 *  which for unknown reasons causes a null reference error.
		 */ 
		converterPriority: 'high',
	});

	conversion.for('dataDowncast').elementToElement({
		model: ELEMENTS.footnoteItem,
		view: {
			name: 'li',
			attributes: {
				[ATTRIBUTES.footnoteItem]: '',
			},
			classes: [CLASSES.footnoteItem],
		},
	});

	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.footnoteItem,
		view: {
			name: 'li',
			attributes: {
				[ATTRIBUTES.footnoteItem]: '',
			},
			classes: [CLASSES.footnoteItem],
		},
	});

	/***********************************Footnote Reference Conversion************************************/

	conversion.for('upcast').elementToElement({
		view: {
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

	/***********************************Footnote Back Link Conversion************************************/

	conversion.for('upcast').elementToElement({
		view: {
			attributes: {
				[ATTRIBUTES.footnoteBackLink]: true,
			},
		},
		model: (viewElement, conversionApi) => {
			const modelWriter = conversionApi.writer;
			const id = viewElement.getAttribute(ATTRIBUTES.footnoteId);
			if(id === undefined) {
				return null;
			}

			return modelWriter.createElement(
				ELEMENTS.footnoteBackLink,
				{
					[ATTRIBUTES.footnoteId]: id,
				}
			);
		}
	});

	conversion.for('dataDowncast').elementToElement({
		model: ELEMENTS.footnoteBackLink,
		view: createFootnoteBackLinkViewElement,
	});

	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.footnoteBackLink,
		view: {
			name: 'span',
			classes: [CLASSES.hidden, CLASSES.footnoteBackLink],
			attributes: {
				[ATTRIBUTES.footnoteBackLink]: '',
			},
		}
	});

};

/**
 * Creates and returns a view element for a footnote backlink,
 * which returns to the inline reference in the text.
 * @param {ModelElement} modelElement
 * @param {DowncastConversionApi} conversionApi
 * @returns {ContainerElement}
 */
function createFootnoteBackLinkViewElement(modelElement, conversionApi) {
	const viewWriter = conversionApi.writer;
	const id = modelElement.getAttribute(ATTRIBUTES.footnoteId);
	if(id === undefined) {
		throw new Error('Footnote return link has no provided Id.')
	}

	const footnoteBackLinkView = viewWriter.createContainerElement('span', {
		class: [CLASSES.footnoteBackLink, CLASSES.hidden].join(' '),
		[ATTRIBUTES.footnoteBackLink]: '',
		[ATTRIBUTES.footnoteId]: id,
	});
	const anchor = viewWriter.createContainerElement('a', { href: `#fnref${id}` });
	const innerText = viewWriter.createText(`↩`);

	viewWriter.insert(viewWriter.createPositionAt(anchor, 0), innerText);
	viewWriter.insert(viewWriter.createPositionAt(footnoteBackLinkView, 0), anchor);

	return footnoteBackLinkView;
}

/**
 * Creates and returns a view element for a footnote reference.
 * @param {ModelElement} modelElement
 * @param {DowncastConversionApi} conversionApi
 * @returns {ContainerElement}
 */
function createFootnoteReferenceViewElement(modelElement, conversionApi) {
	const viewWriter = conversionApi.writer;
	const id = modelElement.getAttribute(ATTRIBUTES.footnoteId);
	if(id === undefined) {
		throw new Error('Footnote reference has no provided Id.')
	}

	const footnoteReferenceView = viewWriter.createContainerElement('span', {
		class: CLASSES.footnoteReference,
		[ATTRIBUTES.footnoteReference]: '',
		[ATTRIBUTES.footnoteId]: id,
		id: `fnref${id}`,
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
 * @typedef {Object} Data
 * @property {Node | TextProxy} item
 * @property {string} attributeOldValue
 * @property {string} attributeNewValue
 */

/**
 * Updates all references for a single footnote. This function is called when
 * the id attribute of an existing footnote changes, which happens when a footnote 
 * with a lower id is deleted, which is triggered by `_removeFootnote` in
 * footnoteEditing.js.
 * @param {Data} data provides the old and new values of the changed attribute.
 * @param {DowncastConversionApi} conversionApi
 * @param {Editor} editor
 * @param {RootElement} rootElement
 * @returns
 */
function updateReferences(data, conversionApi, editor, rootElement) {
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
		e => e.is('element', ELEMENTS.footnoteReference) && e.getAttribute(ATTRIBUTES.footnoteId) === attributeOldValue
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
function updateFootnoteItemView(data, conversionApi, editor) {
	/** @type {{item: ModelElement, attributeOldValue: string, attributeNewValue: string}} */
	// @ts-ignore - type casting in assign statements enough to appease JSDoc is nigh impossible
	const { item, attributeOldValue, attributeNewValue } = data;
	conversionApi.consumable.add(item, `attribute:${ATTRIBUTES.footnoteId}:${ELEMENTS.footnoteItem}`);
	if (!(item instanceof ModelElement) || !conversionApi.consumable.consume(item, `attribute:${ATTRIBUTES.footnoteId}:${ELEMENTS.footnoteItem}`)) {
		return;
	}

	const itemView = conversionApi.mapper.toViewElement(item);

	if (attributeOldValue === null || !itemView) {
		return;
	}

	const viewWriter = conversionApi.writer;

	viewWriter.setAttribute('id', `fn${attributeNewValue}`, itemView);
}

/**
 * @param {Data} data
 * @param {DowncastConversionApi} conversionApi
 * @param {Editor} editor
 * @returns
 */
function updateFootnoteReferenceView (data, conversionApi, editor) {
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
