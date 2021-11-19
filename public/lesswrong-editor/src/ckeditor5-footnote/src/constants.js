// @ts-check

/**
 * @typedef {"footnoteReference"|"footnoteItem"|"footnoteSection"|"footnoteList"} FootnoteElement
 * @typedef {"footnote-reference"|"footnote-item"|"footnote-section"|"footnote-list"} FootnoteClass
 * @typedef {"InsertFootnote"} FootnoteCommand
*/

export const DATA_FOOTNOTE_ID = "data-footnote-id";

/** @type {Object<String, FootnoteElement>} */
export const ELEMENTS = {
	footnoteReference: "footnoteReference",
	footnoteItem: "footnoteItem",
	footnoteSection: "footnoteSection",
	footnoteList: "footnoteList",
};

/** @type {Object<String, FootnoteClass>} */
export const CLASSES = {
	footnoteReference: "footnote-reference",
	footnoteItem: "footnote-item",
	footnoteSection: "footnote-section",
	footnoteList: "footnote-list",
};

/** @type {Object<String, FootnoteCommand>} */
export const COMMANDS = {
	insertFootnote: "InsertFootnote",
}
