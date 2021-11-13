// @ts-check

export const defineSchema = schema => {
	/***********************************Footnote Section Schema***************************************/
	schema.register('footnoteSection', {
		isObject: true,
		allowWhere: '$block',
		allowAttributes: ['id', 'class'],
	});

	schema.register('footnoteList', {
		allowIn: 'footnoteSection',
		allowContentOf: '$root',
		isInline: true,
		allowAttributes: ['id', 'data-footnote-id', 'class'],
	});

	schema.register('footnoteItem', {
		allowIn: 'footnoteList',
		allowWhere: '$text',
		isInline: true,
		isObject: true,
		allowAttributes: ['id', 'data-footnote-id', 'class'],
	});

	// @ts-ignore -- returning true here prevents future listeners from firing.
	// (as does return false, it just also prevents the child add operation from happening.)
	// The below pattern matches the canonical use in the docs--the type signature is just wrong.
	schema.addChildCheck((context, childDefinition) => {
		if (context.endsWith('footnoteList') && childDefinition.name === 'footnoteSection') {
			return false;
		}
	});

	/***********************************Footnote Inline Schema***************************************/
	schema.register('noteHolder', {
		allowWhere: '$text',
		isInline: true,
		isObject: true,
		allowAttributes: [ 'id', 'data-footnote-id', 'class' ],
	});
}
