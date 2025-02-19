// @ts-check (uses JSDoc types for type checking)

export const TOOLBAR_COMPONENT_NAME = 'footnote';
export const DATA_FOOTNOTE_ID = 'data-footnote-id';

export const ELEMENTS = {
	footnoteItem: "footnoteItem",
	footnoteReference: "footnoteReference",
	footnoteSection: "footnoteSection",
	footnoteContent: "footnoteContent",
	footnoteBackLink: "footnoteBackLink",
};

export const CLASSES = {
	footnoteContent: "footnote-content",
	footnoteItem: "footnote-item",
	footnoteReference: "footnote-reference",
	footnoteSection: "footnote-section",
	footnoteBackLink: "footnote-back-link",
	footnotes: "footnotes", // a class already used on our sites for the footnote section
	hidden: "hidden",
};

export const COMMANDS = {
	insertFootnote: "InsertFootnote",
}

export const ATTRIBUTES = {
	footnoteContent: "data-footnote-content",
	footnoteId: "data-footnote-id",
	footnoteIndex: "data-footnote-index",
	footnoteItem: "data-footnote-item",
	footnoteReference: "data-footnote-reference",
	footnoteSection: "data-footnote-section",
	footnoteBackLink: "data-footnote-back-link",
	footnoteBackLinkHref: "data-footnote-back-link-href",
};
