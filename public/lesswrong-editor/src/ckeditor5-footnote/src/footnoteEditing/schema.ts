// @ts-check (uses JSDoc types for type checking)

import { ATTRIBUTES, ELEMENTS } from "../constants";
import type Schema from '@ckeditor/ckeditor5-engine/src/model/schema';

/**
 * Declares the custom element types used by the footnotes plugin.
 * See here for the meanings of each rule: https://ckeditor.com/docs/ckeditor5/latest/api/module_engine_model_schema-SchemaItemDefinition.html#member-isObject
 */
export const defineSchema = (schema: Schema) => {
	/**
	 * Footnote section at the footer of the document.
	 */
	schema.register(ELEMENTS.footnoteSection, {
		isObject: true,
		allowWhere: '$block',
		allowIn: '$root',
		allowChildren: ELEMENTS.footnoteItem,
		allowAttributes: [ATTRIBUTES.footnoteSection],
	});

	/**
	 * Individual footnote item within the footnote section.
	 */
	schema.register(ELEMENTS.footnoteItem, {
		isBlock: true,
		isObject: true,
		allowContentOf: '$root',
		allowAttributes: [ATTRIBUTES.footnoteSection, ATTRIBUTES.footnoteId, ATTRIBUTES.footnoteIndex],
	})

	/**
	 * Editable footnote item content container.
	 */
	schema.register(ELEMENTS.footnoteContent, {
		allowIn: ELEMENTS.footnoteItem,
		allowContentOf: '$root',
		allowAttributes: [ATTRIBUTES.footnoteSection],
	});

	/**
	 * Inline footnote citation, placed within the main text.
	 */
	schema.register(ELEMENTS.footnoteReference, {
		allowWhere: '$text',
		isInline: true,
		isObject: true,
		allowAttributes: [ATTRIBUTES.footnoteReference, ATTRIBUTES.footnoteId, ATTRIBUTES.footnoteIndex],
	});

	/**
	 * return link which takes you from the footnote to the inline reference.
	 */
	schema.register(ELEMENTS.footnoteBackLink, {
		allowIn: ELEMENTS.footnoteItem,
		isInline: true,
		isSelectable: false,
		allowAttributes: [ATTRIBUTES.footnoteBackLink, ATTRIBUTES.footnoteId]
	})

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
