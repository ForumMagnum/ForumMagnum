// @ts-check

import { ATTRIBUTES, ELEMENTS } from "../constants";
import Schema from '@ckeditor/ckeditor5-engine/src/model/schema';

/**
 * Declares the custom element types used by the footnotes plugin.
 * See here for the meanings of each rule: https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_schema-SchemaItemDefinition.html#member-isObject
 * @param {Schema} schema 
 * @returns {void}
 */
export const defineSchema = schema => {
	/**	
	 * Footnote section at the footer of the document.
	*/
	schema.register(ELEMENTS.footnoteSection, {
		isObject: true,
		allowWhere: '$block',
		allowAttributes: ['id', ATTRIBUTES.footnoteSection, 'class'],
	});

	/**
	 * Editable footnote contents. 
	 */
	schema.register(ELEMENTS.footnoteList, {
		allowIn: ELEMENTS.footnoteSection,
		allowContentOf: '$root',
		isInline: true,
		allowAttributes: ['id', ATTRIBUTES.footnoteList, ATTRIBUTES.footnoteId, 'class'],
	});

	/**
	 * The footnote label within the footnotes section. Contains only the text (e.g.) "1. ".
	 * Not directly editable.
	 */
	schema.register(ELEMENTS.footnoteItem, {
		allowIn: ELEMENTS.footnoteList,
		allowWhere: '$text',
		isInline: true,
		isObject: true,
		allowAttributes: ['id', ATTRIBUTES.footnoteItem, ATTRIBUTES.footnoteId, 'class'],
	});

	/**
	 * Inline footnote citation, placed within the main text.
	 */
	schema.register(ELEMENTS.footnoteReference, {
		allowWhere: '$text',
		isInline: true,
		isObject: true,
		allowAttributes: [ 'id', ATTRIBUTES.footnoteReference, ATTRIBUTES.footnoteId, 'class' ],
	});

	// @ts-ignore -- returning true here prevents future listeners from firing.
	// (as does return false, it just also prevents the child add operation from happening.)
	// The below pattern matches the canonical use in the docs--the type signature is just wrong.
	schema.addChildCheck((context, childDefinition) => {
		if (context.endsWith(ELEMENTS.footnoteList) && childDefinition.name === ELEMENTS.footnoteSection) {
			return false;
		}
	});
}
