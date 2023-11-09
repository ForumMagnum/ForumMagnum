// @ts-check (uses JSDoc types for type checking)

import { Editor } from '@ckeditor/ckeditor5-core';
import { ATTRIBUTES, CLASSES, ELEMENTS } from './constants';

/**
 * Defines methods for converting between model, data view, and editing view representations of each element type.
 * @param {Editor} editor
 * @returns {void}
 * */
export const defineConverters = (editor) => {
	const conversion = editor.conversion;

	/***********************************Footnote Section Conversion************************************/
	// ((data) view → model)
	conversion.for('upcast').elementToElement({
		view: {
			attributes: ATTRIBUTES.binaryQuestion.reduce((acc, attr) => ({ ...acc, [attr]: true }), {}),
		},
		model:(viewElement, { writer: modelWriter }) => {
            const attributes = ATTRIBUTES.binaryQuestion.reduce((acc, attr) => (
                { ...acc, [attr]: viewElement.getAttribute(attr) }
            ), {class: CLASSES.binaryQuestion})
            console.log(attributes)
            return modelWriter.createElement(ELEMENTS.binaryQuestion, attributes)
		},
	});
	
	// (model → data view)
	conversion.for('dataDowncast').elementToElement({
		model: ELEMENTS.binaryQuestion,
		view: (modelElement, { writer: viewWriter }) => {
			const attributes = ATTRIBUTES.binaryQuestion.reduce((acc, attr) => (
				{ ...acc, [attr]: modelElement.getAttribute(attr) }
				), {class: CLASSES.binaryQuestion})
			console.log('dataDowncast', attributes)
            return viewWriter.createContainerElement('div', attributes)
		}
	});
	
	// (model → editing view)
	conversion.for('editingDowncast').elementToElement({
		model: ELEMENTS.binaryQuestion,
		view: (modelElement, { writer: viewWriter }) => {
			const attributes = ATTRIBUTES.binaryQuestion.reduce((acc, attr) => (
				{ ...acc, [attr]: modelElement.getAttribute(attr) }
				), {class: CLASSES.binaryQuestion})
			console.log(modelElement, ATTRIBUTES.binaryQuestion)
			console.log('editingDowncast', attributes)
            return viewWriter.createContainerElement('div', attributes)
		}
	});
};
