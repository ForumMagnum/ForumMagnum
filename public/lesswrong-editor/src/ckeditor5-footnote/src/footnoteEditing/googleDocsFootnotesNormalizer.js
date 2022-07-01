// @ts-check

import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';
import Matcher from '@ckeditor/ckeditor5-engine/src/view/matcher';
import { ATTRIBUTES } from '../constants';
import Range from '@ckeditor/ckeditor5-engine/src/view/range';
import Element from '@ckeditor/ckeditor5-engine/src/view/element';

export default class GoogleDocsFootnotesNormalizer {
	isActive() {
		return true;
	}
	execute(data) {
		const writer = new UpcastWriter( data.content.document );

		/**
		 * @type {Range}
		*/
		// @ts-ignore: DefinitelyTyped mistypes the return values of UpcastWriter's range events
		// as TypeScript Ranges, rather than CKEditor Ranges.
		const documentRange = writer.createRangeIn(data.content);
		const backLinks = this._getFootnoteBackLinks(documentRange)
		const references = this._getFootnoteReferences(documentRange, backLinks)
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
		const firstBackLink = backLinks[1].item;
		if(
			!firstBackLink.parent ||
			!firstBackLink.parent.parent ||
			!firstBackLink.parent.parent.is('element')
		) {
			console.error("Unexpected DOM structure: expected footnote backLink to be nested within two parent tags.")
			return;
		}
		const firstFootnote = firstBackLink.parent.parent;
		/**
		 * @type {number}
		*/
		// @ts-ignore: null case only happens for unattached elements, which we know isn't true here.
		const firstFootnoteIndex = firstFootnote.index;
		const { previousSibling } = firstFootnote; 
		/**
		 * @type {Range}
		*/
		// @ts-ignore DefinitelyTyped mistyping of Range
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
			if(!item.parent || !item.parent.parent || !item.parent.parent.is('element')) {
				throw new Error("Unexpected Dom structure; expected footnote backLink to be nested within two parent tags.")
			}
			const footnoteContent = item.parent.parent;
			/**
			 * @type {Range}
			*/
			// @ts-ignore DefinitelyTyped mistyping of Range
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
				// @ts-ignore: startPosition isn't reuqired here.
				[...footnoteItemRange.getItems({ shallow: true})]
					.filter(item => item.is('element'))
					// @ts-ignore: previous line is a type guard.
					.map(element => writer.clone(element, true)),
			);
			return writer.createElement('div', { 
				[ATTRIBUTES.footnoteItem]: '',
				[ATTRIBUTES.footnoteId]: id,
				[ATTRIBUTES.footnoteIndex]: index,
			}, [footnoteBackLink, footnoteContents]);
		});

		const footnoteSection = writer.createElement('div', {[ATTRIBUTES.footnoteSection]: ''}, footnoteItems);

		for(const item of [...footnoteSectionRange.getItems()]) {
			if (item.is('element')) {
				writer.remove(item);
			}
		}
		if(previousSibling && previousSibling.is('element') && previousSibling.name === 'hr') {
			writer.replace(previousSibling, footnoteSection);
		} else {
			writer.insertChild(firstFootnoteIndex, footnoteSection, footnoteSectionParent)
		}
	}

	/**
	 * 
	 * @param {Range} documentRange
	 * @returns {Object.<string, {item: Element, id: string}>}
	 */
	_getFootnoteBackLinks(documentRange) {
		const idPattern = /^ftnt(\d+)$/;
		const footnoteBackLinkMatcher = new Matcher({
			name: 'a',
			attributes: {
				id: idPattern,
			}
		})
		return [...documentRange]
			.filter(({ item, type }) => type === 'elementStart' && footnoteBackLinkMatcher.match(item))
			.map(({ item }) => (
				{ 
					// @ts-ignore: matcher above eliminates the null / undefined cases here.
					index: item.getAttribute('id').match(idPattern)[1], 
					item,
					id: Math.random().toString(36).slice(2),
				}))
			.reduce((acc, { index, item, id }) => ({...acc, [index]: { item, id }}), {})
	}

	/**
	 * 
	 * @param {Range} documentRange
	 * @param {Object.<string, {item: Element, id: string}>} backLinks
	 * @returns {Object.<string, {item: Element, id: string}>}
	 */
	_getFootnoteReferences(documentRange, backLinks) {
		const idPattern = /^ftnt_ref(\d+)$/;
		const footnoteReferenceMatcher = new Matcher({
			name: 'a',
			attributes: {
				id: idPattern 
			}
		});
		return [...documentRange]
		.reduce((acc, { item, type }) => {
			if (
				type === 'elementStart' &&
				item &&
				footnoteReferenceMatcher.match(item)
			) {
				// ensure that a matching footnote exists for this reference
				// @ts-ignore: matcher above eliminates the null / undefined cases here.
				const index = item.getAttribute('id').match(idPattern)[1]
				if(backLinks.hasOwnProperty(index)) {
					return {...acc, [index]: { item, id: backLinks[index] }};
				}
			}
			return acc;
		}, {})
	}
}
