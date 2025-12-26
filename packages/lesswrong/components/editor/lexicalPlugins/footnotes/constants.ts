/**
 * Constants for the Lexical footnotes plugin
 */

export const FOOTNOTE_ELEMENT_TYPES = {
  footnoteSection: 'footnote-section',
  footnoteItem: 'footnote-item', 
  footnoteContent: 'footnote-content',
  footnoteReference: 'footnote-reference',
  footnoteBackLink: 'footnote-back-link',
} as const;

export const FOOTNOTE_CLASSES = {
  footnoteContent: 'footnote-content',
  footnoteItem: 'footnote-item',
  footnoteReference: 'footnote-reference',
  footnoteSection: 'footnote-section',
  footnoteBackLink: 'footnote-back-link',
  footnotes: 'footnotes',
} as const;

export const FOOTNOTE_ATTRIBUTES = {
  footnoteContent: 'data-footnote-content',
  footnoteId: 'data-footnote-id',
  footnoteIndex: 'data-footnote-index',
  footnoteItem: 'data-footnote-item',
  footnoteReference: 'data-footnote-reference',
  footnoteSection: 'data-footnote-section',
  footnoteBackLink: 'data-footnote-back-link',
} as const;

/**
 * Generate a random alphanumeric ID for footnotes
 */
export function generateFootnoteId(): string {
  return Math.random().toString(36).slice(2);
}

