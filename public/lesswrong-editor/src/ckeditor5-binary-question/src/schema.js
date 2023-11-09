// @ts-check (uses JSDoc types for type checking)

import { ATTRIBUTES, ELEMENTS } from "./constants";
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
	schema.register(ELEMENTS.binaryQuestion, {
		isObject: true,
		allowWhere: '$block',
		allowIn: '$root',
		allowAttributes: ATTRIBUTES.binaryQuestion,
	});

	// @ts-ignore -- returning true here prevents future listeners from firing.
	// (as does return false; returning false just also prevents the child add operation from happening.)
	// The below pattern matches the canonical use in the docs--the type signature is just wrong.
	schema.addChildCheck((context, childDefinition) => {
		if (context.endsWith(ELEMENTS.footnoteContent) && childDefinition.name === ELEMENTS.footnoteSection) {
			return false;
		}
		if (context.endsWith(ELEMENTS.footnoteContent) && childDefinition.name === 'listItem') {
			return false;
		}
	});
}
