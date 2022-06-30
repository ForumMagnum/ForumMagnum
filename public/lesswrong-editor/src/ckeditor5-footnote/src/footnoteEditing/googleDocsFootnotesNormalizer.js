// @ts-check

import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';
import Matcher from '@ckeditor/ckeditor5-engine/src/view/matcher';
import { ATTRIBUTES } from '../constants';

export default class GoogleDocsFootnotesNormalizer {
	isActive() {
		return true;
	}
	execute(data) {
		const writer = new UpcastWriter( data.content.document );

		const documentRange = writer.createRangeIn( data.content );

		const footnoteBacklinkMatcher = new Matcher({
			name: 'a',
			attributes: {
				id: /^ftnt\d+$/
			}
		});
		const footnoteReferenceMatcher = new Matcher({
			name: 'a',
			attributes: {
				id: /^ftnt_ref\d+$/
			}
		});
		const backlinks = {};
		const references = {};
		// @ts-ignore: DefinitelyTyped mistypes the return values of UpcastWriters range events
		// as TypeScript Ranges, rather than CKEditor Ranges.
		for ( const value of documentRange ) {
			const { item, type } = value
			if (type === 'elementStart' && footnoteReferenceMatcher.match(item)) {
				const index = item.getAttribute('id').match(/ftnt_ref(\d+)/)[1];
				references[index] = 
					{ 
						item,
						id: Math.random().toString(36).slice(2),
					};
			}
			if (type === 'elementStart' && footnoteBacklinkMatcher.match(item)) {
				const index = item.getAttribute('id').match(/ftnt(\d+)/)[1];
				backlinks[index] = {item, id: references[index].id};
			}
		}
		for (const [ index, { item, id } ] of Object.entries(references)) {
			writer.setAttribute(ATTRIBUTES.footnoteReference, '', item);
			writer.setAttribute(ATTRIBUTES.footnoteIndex, index, item);
			writer.setAttribute(ATTRIBUTES.footnoteId, id, item);
		}
		if(!Object.keys(backlinks).length) {
			return;
		}
		const previousItem = backlinks[1].item.parent.parent.previousSibling
		const footnoteSectionRange = writer.createRange(
 			writer.createPositionAfter(previousItem),
			// @ts-ignore: DefinitelyTyped mistyping of Range
 			writer.createPositionAt(documentRange.end),
		)
		const footnoteItems = Object.entries(backlinks).map(([ index, {item, id}]) => {
			const end = backlinks.hasOwnProperty(parseInt(index) + 1) ? 
				writer.createPositionBefore(backlinks[parseInt(index) + 1].item.parent.parent) :
				// @ts-ignore: DefinitelyTyped mistyping of Range
				documentRange.end;
			const footnoteItemRange = writer.createRange(
				writer.createPositionAfter(item),
				end
			)
			const footnoteBackLink = writer.createElement('span', {
				[ATTRIBUTES.footnoteBackLink]: '',
				[ATTRIBUTES.footnoteId]: id,
			});
			const footnoteContents = writer.createElement('div', 
			{
				[ATTRIBUTES.footnoteContent]: '',
				[ATTRIBUTES.footnoteId]: id,
				[ATTRIBUTES.footnoteIndex]: index,
			}, 
			// @ts-ignore DefinitelyTyped mistyping of Range
			[...footnoteItemRange.getItems({ shallow: true})]
				.filter(item => item.is('element'))
				.map(element => writer.clone(element, true))
		)
			return writer.createElement('div', { 
				[ATTRIBUTES.footnoteItem]: '',
				[ATTRIBUTES.footnoteId]: id,
				[ATTRIBUTES.footnoteIndex]: index,
			}, [footnoteBackLink, footnoteContents])
		})

		const footnoteSection = writer.createElement('div', {[ATTRIBUTES.footnoteSection]: ''}, footnoteItems)

		// @ts-ignore DefinitelyTyped mistyping of Range
		for(const item of [...footnoteSectionRange.getItems()]) {
			if (item.is('element')) {
				writer.remove(item)
			}
		}
		writer.replace(previousItem, footnoteSection)
	}
}
