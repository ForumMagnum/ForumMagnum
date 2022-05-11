// export function MentionCustomization(editor) {
//   // The upcast converter will convert view <a class="mention" href="" data-user-id="">
//   // elements to the model 'mention' text attribute.
//   editor.conversion.for('upcast').elementToAttribute({
// 	view: {
// 	  name: 'a',
// 	  key: 'data-mention',
// 	  classes: 'mention',
// 	  attributes: {
// 		href: true,
// 		// 'data-user-id': true,
// 	  },
// 	},
// 	model: {
// 	  key: 'mention',
// 	  value: viewItem => {
// 		// The mention feature expects that the mention attribute value
// 		// in the model is a plain object with a set of additional attributes.
// 		// In order to create a proper object use the toMentionAttribute() helper method:
// 		const mentionAttribute = editor.plugins.get('Mention').toMentionAttribute(viewItem, {
// 		  // Add any other properties that you need.
// 		  slug: viewItem.getAttribute('href'),
// 		  title: viewItem.getAttribute('data-mention'),
// 		  // userId: viewItem.getAttribute('data-user-id'),
// 		})
//
// 		return mentionAttribute
// 	  },
// 	},
// 	converterPriority: 'high',
//   })
//
//   // Downcast the model 'mention' text attribute to a view <a> element.
//   editor.conversion.for('downcast').attributeToElement({
// 	model: 'mention',
// 	view: (modelAttributeValue, {writer}) => {
// 	  console.log(modelAttributeValue)
// 	  // Do not convert empty attributes (lack of value means no mention).
// 	  if (!modelAttributeValue) {
// 		return
// 	  }
//
// 	  //    { id: '@swarley', userId: '1', name: 'Barney Stinson', link: 'https://www.imdb.com/title/tt0460649/characters/nm0000439' },
// 	  const attributeElement = writer.createAttributeElement('a', {
// 		class: 'mention',
// 		'data-mention': modelAttributeValue.title,
// 		// 'data-user-id': modelAttributeValue.userId,
// 		'href': modelAttributeValue.slug,
// 	  }, {
// 		// Make mention attribute to be wrapped by other attribute elements.
// 		priority: 20,
// 		// Prevent merging mentions together.
// 		id: modelAttributeValue._id,
// 	  })
// 	  console.log({attributeElement})
// 	  return attributeElement
// 	},
// 	converterPriority: 'high',
//   })
// }

export function MentionCustomization( editor ) {
}
