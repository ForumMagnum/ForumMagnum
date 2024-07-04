// @ts-check (uses JSDoc types for type checking)

import type { Editor } from '@ckeditor/ckeditor5-core';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import type ContainerElement from '@ckeditor/ckeditor5-engine/src/view/containerelement';
import type { DowncastConversionApi } from '@ckeditor/ckeditor5-engine/src/conversion/downcastdispatcher';
import ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';
import { viewQueryElement, viewQueryText } from '../utils';
import { ATTRIBUTES, CLASSES, ELEMENTS } from '../constants';

/**
 * Defines methods for converting between model, data view, and editing view representations of each element type.
 */
export const defineConverters = (editor: Editor): void => {
	const conversion = editor.conversion;

	/***********************************Attribute Conversion************************************/

	conversion.for('downcast').attributeToAttribute({
		model: ATTRIBUTES.footnoteId,
		view: ATTRIBUTES.footnoteId,
	})

	conversion.for('downcast').attributeToAttribute({
		model: ATTRIBUTES.footnoteIndex,
		view: ATTRIBUTES.footnoteIndex,
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
		converterPriority: 'high',
	});

	// (model → data view)
	conversion.for('dataDowncast').elementToElement({
		model: ELEMENTS.footnoteSection,
		view: {
			name: 'ol',
			attributes: {
				[ATTRIBUTES.footnoteSection]: '',
				role: 'doc-endnotes',
			},
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
			const section = viewWriter.createContainerElement('div', { [ATTRIBUTES.footnoteSection]: '', role: 'doc-endnotes list', class: CLASSES.footnoteSection });

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
		model: (viewElement, conversionApi) => {
			const modelWriter = conversionApi.writer;

			return modelWriter.createElement(
				ELEMENTS.footnoteContent,
			);
		}
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
				[ATTRIBUTES.footnoteItem]: true
			},
		},
		model: (viewElement, conversionApi) => {
			const modelWriter = conversionApi.writer;
			const id = viewElement.getAttribute(ATTRIBUTES.footnoteId);
			const index = viewElement.getAttribute(ATTRIBUTES.footnoteIndex);
			if(id === undefined || index === undefined) {
				return null;
			}

			return modelWriter.createElement(
				ELEMENTS.footnoteItem,
				{
					[ATTRIBUTES.footnoteIndex]: index,
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
		view: createFootnoteItemViewElement,
	});

	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.footnoteItem,
		view: createFootnoteItemViewElement,
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
			const index = viewElement.getAttribute(ATTRIBUTES.footnoteIndex);
			const id = viewElement.getAttribute(ATTRIBUTES.footnoteId);
			if(index === undefined || id === undefined) {
				return null;
			}

			return modelWriter.createElement(
				ELEMENTS.footnoteReference,
				{
					[ATTRIBUTES.footnoteIndex]: index,
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

	/** This is an event listener for changes to the `data-footnote-index` attribute on `footnoteReference` elements.
	 * When that event fires, the callback function below updates the displayed view of the footnote reference in the 
	 * editor to match the new index.
	*/
	conversion.for('editingDowncast')
		.add(dispatcher => {
			dispatcher.on(
				`attribute:${ATTRIBUTES.footnoteIndex}:${ELEMENTS.footnoteReference}`,
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
		view: createFootnoteBackLinkViewElement,
	});
};

/**
 * Creates and returns a view element for a footnote backlink,
 * which navigates back to the inline reference in the text. Used
 * for both data and editing downcasts.
 */
function createFootnoteBackLinkViewElement(modelElement: ModelElement, conversionApi: DowncastConversionApi): ContainerElement {
	const viewWriter = conversionApi.writer;
	const id = `${modelElement.getAttribute(ATTRIBUTES.footnoteId)}`;
	if(id === undefined) {
		throw new Error('Footnote return link has no provided Id.')
	}

	const footnoteBackLinkView = viewWriter.createContainerElement('span', {
		class: CLASSES.footnoteBackLink,
		[ATTRIBUTES.footnoteBackLink]: '',
		[ATTRIBUTES.footnoteId]: id,
	});
	const sup = viewWriter.createContainerElement('sup');
	const strong = viewWriter.createContainerElement('strong');
	const anchor = viewWriter.createContainerElement('a', { href: `#fnref${id}` });
	const innerText = viewWriter.createText('^');

	viewWriter.insert(viewWriter.createPositionAt(anchor, 0), innerText);
	viewWriter.insert(viewWriter.createPositionAt(strong, 0), anchor);
	viewWriter.insert(viewWriter.createPositionAt(sup, 0), strong);
	viewWriter.insert(viewWriter.createPositionAt(footnoteBackLinkView, 0), sup);

	return footnoteBackLinkView;
}

/**
 * Creates and returns a view element for an inline footnote reference. Used for both
 * data downcast and editing downcast conversions.
 */
function createFootnoteReferenceViewElement(modelElement: ModelElement, conversionApi: DowncastConversionApi): ContainerElement {
	const viewWriter = conversionApi.writer;
	const index = `${modelElement.getAttribute(ATTRIBUTES.footnoteIndex)}`;
	const id = `${modelElement.getAttribute(ATTRIBUTES.footnoteId)}`;
	if(index === undefined) {
		throw new Error('Footnote reference has no provided index.')
	}
	if(id === undefined) {
		throw new Error('Footnote reference has no provided id.')
	}

	const footnoteReferenceView = viewWriter.createContainerElement('span', {
		class: CLASSES.footnoteReference,
		[ATTRIBUTES.footnoteReference]: '',
		[ATTRIBUTES.footnoteIndex]: index,
		[ATTRIBUTES.footnoteId]: id,
		role: 'doc-noteref',
		id: `fnref${id}`,
	});

	const innerText = viewWriter.createText(`[${index}]`);
	const link = viewWriter.createContainerElement('a', {href: `#fn${id}`});
	const superscript = viewWriter.createContainerElement('sup');
	viewWriter.insert(viewWriter.createPositionAt(link, 0), innerText);
	viewWriter.insert(viewWriter.createPositionAt(superscript, 0), link);
	viewWriter.insert(viewWriter.createPositionAt(footnoteReferenceView, 0), superscript);

	return footnoteReferenceView;
}

/**
 * Creates and returns a view element for an inline footnote reference. Used for both
 * data downcast and editing downcast conversions.
 */
function createFootnoteItemViewElement(modelElement: ModelElement, conversionApi: DowncastConversionApi): ContainerElement {
	const viewWriter = conversionApi.writer;
	const index = modelElement.getAttribute(ATTRIBUTES.footnoteIndex);
	const id = modelElement.getAttribute(ATTRIBUTES.footnoteId);
	if(!index) {
		throw new Error('Footnote item has no provided index.')
	}
	if(!id) {
		throw new Error('Footnote item has no provided id.')
	}

	return viewWriter.createContainerElement('li', {
		class: CLASSES.footnoteItem,
		[ATTRIBUTES.footnoteItem]: '',
		[ATTRIBUTES.footnoteIndex]: `${index}`,
		[ATTRIBUTES.footnoteId]: `${id}`,
		role: 'doc-endnote',
		id: `fn${id}`,
	});
}

/**
 * Triggers when the index attribute of a footnote changes, and
 * updates the editor display of footnote references accordingly.
 */
function updateFootnoteReferenceView (
	data: {
	  item: ModelElement,
	  attributeOldValue: string,
	  attributeNewValue: string,
	},
	conversionApi: DowncastConversionApi,
	editor: Editor
) {
	const { item, attributeNewValue: newIndex } = data;
	if (!(item instanceof ModelElement) || !conversionApi.consumable.consume(item, `attribute:${ATTRIBUTES.footnoteIndex}:${ELEMENTS.footnoteReference}`)) {
		return;
	}

	const footnoteReferenceView = conversionApi.mapper.toViewElement(item);

	if (!footnoteReferenceView) {
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
	const innerText = viewWriter.createText(`[${newIndex}]`);
	viewWriter.insert(viewWriter.createPositionAt(anchor, 0), innerText);

	viewWriter.setAttribute('href', `#fn${item.getAttribute(ATTRIBUTES.footnoteId)}`, anchor);
	viewWriter.setAttribute(ATTRIBUTES.footnoteIndex, newIndex, footnoteReferenceView);
}
