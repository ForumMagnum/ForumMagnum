// @ts-check (uses JSDoc types for type checking)

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
		allowChildren: ELEMENTS.footnoteItem,
		allowAttributes: ['id', ATTRIBUTES.footnoteSection, 'class'],
	});

	/**
	 * Individual footnote item within the footnote section.
	 */
	schema.register(ELEMENTS.footnoteItem, {
		isBlock: true,
		isObject: true,
		allowContentOf: '$root',
		allowAttributes: ['id', ATTRIBUTES.footnoteSection, ATTRIBUTES.footnoteId, 'class'],
	})

	/**
	 * Editable footnote item content container. 
	 */
	schema.register(ELEMENTS.footnoteContent, {
		allowIn: ELEMENTS.footnoteItem,
		allowContentOf: '$root',
		isBlock: true,
		allowAttributes: ['id', ATTRIBUTES.footnoteSection, ATTRIBUTES.footnoteId, 'class'],
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
	// (as does return false; returning false just also prevents the child add operation from happening.)
	// The below pattern matches the canonical use in the docs--the type signature is just wrong.
	schema.addChildCheck((context, childDefinition) => {
		if (context.endsWith(ELEMENTS.footnoteContent) && childDefinition.name === ELEMENTS.footnoteSection) {
			return false;
		}
	});
}
