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
		const backLinks = {};
		const references = {};
		// @ts-ignore: DefinitelyTyped mistypes the return values of UpcastWriters range events
		// as TypeScript Ranges, rather than CKEditor Ranges.
		for ( const value of documentRange ) {
			const { item, type } = value
			if (type === 'elementStart' && footnoteReferenceMatcher.match(item)) {
				const index = item.getAttribute('id').match(/ftnt_ref(\d+)/)[1];
				references[index] = {item, id: backLinks[index].id};
			}
		}
		// @ts-ignore DefinitelyTyped mistyping of Range
		for ( const value of documentRange ) {
			const { item, type } = value
			if (type === 'elementStart' && footnoteBacklinkMatcher.match(item)) {
				const index = item.getAttribute('id').match(/ftnt(\d+)/)[1];
				backLinks[index] = 
					{ 
						item,
						id: Math.random().toString(36).slice(2),
					};
			}
		}
		for (const [ index, { item, id } ] of Object.entries(references)) {
			writer.setAttribute(ATTRIBUTES.footnoteReference, '', item);
			writer.setAttribute(ATTRIBUTES.footnoteIndex, index, item);
			writer.setAttribute(ATTRIBUTES.footnoteId, id, item);
		}
		if(!Object.keys(backLinks).length) {
			return;
		}
		if(!backLinks[1] || !backLinks[1].item) {
			console.warn("Unexpected DOM structure: missing footnote with index 1.");
			return;
		}
		const firstBacklink = backLinks[1].item;
		if(
			!firstBacklink.parent ||
			!firstBacklink.parent.parent
		) {
			console.error("Unexpected DOM structure: expected footnote backlink to be nested within two parent tags.")
			return;
		}
		const firstFootnote = firstBacklink.parent.parent;
		const firstFootnoteIndex = firstFootnote.index;
		const { previousSibling } = firstFootnote; 
		const footnoteSectionRange = writer.createRange(
 			writer.createPositionBefore(firstFootnote),
			// @ts-ignore: DefinitelyTyped mistyping of Range
 			writer.createPositionAt(documentRange.end),
		)
		const footnoteSectionParent = firstFootnote.parent;
		if(!footnoteSectionParent) {
			console.error("Unexpected DOM structure: expected footnote to have a parent element.")
			return;
		}
		const footnoteItems = Object.entries(backLinks).map(([ index, {item, id}]) => {
			if(!item.parent || !item.parent.parent) {
				throw new Error("Unexpected Dom structure; expected footnote backLink to be nested within two parent tags.")
			}
			const footnoteContent = item.parent.parent;
			const footnoteItemRange = writer.createRange(
				writer.createPositionAfter(item),
				writer.createPositionAfter(footnoteContent),
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
					.map(element => writer.clone(element, true)),
			);
			return writer.createElement('div', { 
				[ATTRIBUTES.footnoteItem]: '',
				[ATTRIBUTES.footnoteId]: id,
				[ATTRIBUTES.footnoteIndex]: index,
			}, [footnoteBackLink, footnoteContents]);
		});

		const footnoteSection = writer.createElement('div', {[ATTRIBUTES.footnoteSection]: ''}, footnoteItems);

		// @ts-ignore DefinitelyTyped mistyping of Range
		for(const item of [...footnoteSectionRange.getItems()]) {
			if (item.is('element')) {
				writer.remove(item);
			}
		}
		if(previousSibling && previousSibling.name === 'hr') {
			writer.replace(previousSibling, footnoteSection);
		} else {
			writer.insertChild(firstFootnoteIndex, footnoteSection, footnoteSectionParent)
		}
	}
}
