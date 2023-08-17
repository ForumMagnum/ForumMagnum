// @ts-check

import UpcastWriter from '@ckeditor/ckeditor5-engine/src/view/upcastwriter';
import Matcher from '@ckeditor/ckeditor5-engine/src/view/matcher';
import { ATTRIBUTES } from '../constants';
import Range from '@ckeditor/ckeditor5-engine/src/view/range';
import Element from '@ckeditor/ckeditor5-engine/src/view/element';
import Document from '@ckeditor/ckeditor5-engine/src/view/document';

/**
 * This class is used for converting footnotes pasted in from Google Docs' Publish to Web view.
 * Using Publish to Web is necessary because the default view doesn't let you select a document
 * and its footnotes at the same time.
 *
 * Here's how this works: pasted text gets converted from an html string into view elements,
 * which then get upcasted to model elements. This class's execute method gets run at the view element stage,
 * using the rarely-needed UpcastWriter to transform the data in preparation for the upcasting
 * step. Specifically, this means adding attributes to each element — both type-specifying
 * attributes like `ATTRIBUTES.footnoteContent`, and context attributes like IDs and indices.
 * From there, the upcast converters in `converters.js` can do the rest.
 */
export default class GoogleDocsFootnotesNormalizer {
	/**
	 * Used by the clipboard pipeline to determine whether to run the execute method
	 * on paste.
	 */
	isActive() {
		return true;
	}
	
	/**
	 * preproceses incoming content for upcasting, adding
	 * identifying attributes to footnoteReferences and footnotebackLinks,
	 * and adding surrounding footnoteContent, footnoteItem, and footnoteSection
	 * elements.
	 * @param {{content: {document: Document}}} data
	 */
	execute(data) {
		const writer = new UpcastWriter( data.content.document );
		/**
		 * Creates a range that spans the entire pasted text. Used
		 * for traversing.
		 * @type {Range}
		*/
		// @ts-ignore: DefinitelyTyped mistypes the return values of UpcastWriter's range events
		// as TypeScript Ranges, rather than CKEditor Ranges.
		const documentRange = writer.createRangeIn(data.content);
		const backLinks = this._getFootnoteBackLinks(documentRange);
		const references = this._getFootnoteReferences(documentRange, backLinks);
		this._preprocessFootnoteReferences(writer, references);
		this._preprocessFootnoteItems(writer, documentRange, backLinks);
	}

	/**
	 * Returns all elements with an id indicating they're a footnote backLink.
	 * (See schema.js for terminology definitions.)
	 * Also generates a random alphanumeric footnote id for each, which facilitates
	 * footnote reordering, undoing batch operations, and allowing multiple documents
	 * to coexist on the same page without collisions (e.g. a post and its comments).
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
		});
		return [...documentRange]
			.reduce((acc, { item, type }) => {
				if (
					type === 'elementStart' &&
					footnoteBackLinkMatcher.match(item)
				) {
					// @ts-ignore: matcher above eliminates the null / undefined cases here.
					const index = item.getAttribute('id').match(idPattern)[1];
					return {
						...acc,
						[index]: {
							item,
							id: Math.random().toString(36).slice(2),
						}
					};
				}
				return acc;
			}, {});
	}

	/**
	 * Finds all anchor tags with an id indicating they're a footnote referenceand
	 * with a backLink that has a matching index. (references to nonexistent footnotes
	 * aren't parsed.)
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
					footnoteReferenceMatcher.match(item)
				) {
					// ensure that a matching footnote exists for this reference
					// @ts-ignore: matcher above eliminates the null / undefined cases here.
					const index = item.getAttribute('id').match(idPattern)[1];
					if(backLinks.hasOwnProperty(index)) {
						return {...acc, [index]: { item, id: backLinks[index].id }};
					}
				}
				return acc;
			}, {});
	}

	/**
	 * For each unprocessed backLink, creates a new element composed of a
	 * footnoteBackLink element and a footnoteContent element, all wrapped in a footnoteItem.
	 *
	 * Presumes a structure s.t. each backlink is wrapped in two elements, the outer of which
	 * contains the entire contents of the footnote.
	 * @param {UpcastWriter} writer
	 * @param {Object.<string, {item: Element, id: string}>} backLinks
	 * @returns {Element[]}
	 */
	_createFootnoteItems(writer, backLinks) {
		return Object.entries(backLinks).map(([ index, {item, id}]) => {
			if(!item.parent || !item.parent.parent || !item.parent.parent.is('element')) {
				throw new Error("Unexpected Dom structure; expected footnote backLink to be nested within two parent tags.");
			}
			const footnoteContent = item.parent.parent;
			/**
			 * These range bounds (start after the backLink, end
			 * after the footnote content) are used to capture
			 * all of the footnote except the backLink, which we
			 * generate ourselves.
			 * @type {Range}
			*/
			// @ts-ignore DefinitelyTyped mistyping of Range
			const footnoteContentRange = writer.createRange(
				writer.createPositionAfter(item),
				writer.createPositionAfter(footnoteContent),
			);
			const newFootnoteBackLink = writer.createElement('span', {
				[ATTRIBUTES.footnoteBackLink]: '',
				[ATTRIBUTES.footnoteId]: id,
			});
			const newFootnoteContent = writer.createElement('div',
				{
					[ATTRIBUTES.footnoteContent]: '',
					[ATTRIBUTES.footnoteId]: id,
					[ATTRIBUTES.footnoteIndex]: index,
				},

				// @ts-ignore: startPosition isn't required here.
				[...footnoteContentRange.getItems({ shallow: true})]
					.filter(item => item.is('element'))
					// @ts-ignore: previous line is a type guard.
					.map(element => writer.clone(element, true)),
			);
			return writer.createElement('div', {
				[ATTRIBUTES.footnoteItem]: '',
				[ATTRIBUTES.footnoteId]: id,
				[ATTRIBUTES.footnoteIndex]: index,
			}, [newFootnoteBackLink, newFootnoteContent]);
		});
	}

	/**
	 * Adds `footnoteReference` `footnoteIndex`, and `footnoteId`
	 * attributes to each footnote reference.
	 * @param {UpcastWriter} writer
	 * @param {Object.<string, {item: Element, id: string}>} references
	 */
	_preprocessFootnoteReferences(writer, references) {
		for (const [ index, { item, id } ] of Object.entries(references)) {
			writer.setAttribute(ATTRIBUTES.footnoteReference, '', item);
			writer.setAttribute(ATTRIBUTES.footnoteIndex, index, item);
			writer.setAttribute(ATTRIBUTES.footnoteId, id, item);
		}
	}

	/**
	 * Generates a new footnoteItem element for each backLink,
	 * wraps them in a footnoteSection element then replaces the
	 * original footnote section with the newly
	 * created element. This clone-and-replace approach is necessary
	 * because UpcastWriter doesn't have a method to wrap existing
	 * content with a new element.
	 * @param {UpcastWriter} writer
	 * @param {Range} documentRange
	 * @param {Object.<string, {item: Element, id: string}>} backLinks
	 */
	_preprocessFootnoteItems(writer, documentRange, backLinks) {
		if(!Object.keys(backLinks).length) {
			return;
		}
		if(!backLinks[1] || !backLinks[1].item) {
			console.error("Unexpected DOM structure: missing footnote with index 1.");
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
 			writer.createPositionAt(documentRange.end),
		);
		const footnoteSectionParent = firstFootnote.parent;
		if(!footnoteSectionParent) {
			console.error("Unexpected DOM structure: expected footnote to have a parent element.")
			return;
		}
		try {
			const footnoteItems = this._createFootnoteItems(writer, backLinks);
			const footnoteSection = writer.createElement('div', {[ATTRIBUTES.footnoteSection]: ''}, footnoteItems);
			/**
			 * getItems converted to an array here
			 * because otherwise the iterator gets out of step
			 * and misses elements.
			 */
			for(const item of [...footnoteSectionRange.getItems()]) {
				if (item.is('element')) {
					writer.remove(item);
				}
			}
			/**
			 * Google Docs' Publish to Web view adds an hr element
			 * before the footnotes section. If that element exists,
			 * this code removes it. This will only be false if
			 * the user pastes only part of the document, or if Google
			 * Docs changes their layout.
			 */
			if(previousSibling && previousSibling.is('element') && previousSibling.name === 'hr') {
				writer.remove(previousSibling);
			}
			writer.insertChild(firstFootnoteIndex, footnoteSection, footnoteSectionParent);
		} catch(error) {
			console.log(error);
		}
	}
}
