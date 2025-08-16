import type { ContentStyleType } from '../common/ContentStylesValues';
import JargonTooltip from '../jargon/JargonTooltip';
import InlineReactHoverableHighlight from '../votes/lwReactions/InlineReactHoverableHighlight';

export const replacementComponentMap = {
  JargonTooltip,
  InlineReactHoverableHighlight,
};

export interface ContentItemBodyProps {
  /**
   * The content to show. This MUST come from a GraphQL resolver which does 
   * sanitization, such as post.contents.html
   */
  dangerouslySetInnerHTML: { __html: string };
  
  /**
   * Type-annotation reflecting that you can make a ref of this and call its
   * methods. (Doing so is handled by React, not by anything inside of this
   * using the ref prop)
   */
  ref?: React.RefObject<ContentItemBodyImperative|null>

  // className: Name of an additional CSS class to apply to this element.
  className?: string;

  /**
   * description: (Optional) A human-readable string describing where this
   * content came from. Used in error logging only, not displayed to users.
   */
  description?: string;

  /**
   * Passed through to HoverPreviewLink with link substitution. Only implemented
   * for hover-previews of tags in particular. (This was a solution to some
   * index pages in the Library being very slow to load).
   */
  noHoverPreviewPrefetch?: boolean;

  /**
   * If passed, all links in the content will have the nofollow attribute added.
   * Use for content that has risk of being spam (eg brand-new users).
   */
  nofollow?: boolean;

  /**
   * Extra elements to insert into the document (used for side-comment
   * indicators). This is a mapping from element IDs of block elements (in the
   * `id` attribute) to React elements to insert into those blocks.
   */
  idInsertions?: Record<string, React.ReactNode>;

  /**
   * Substrings to replace with an element. Used for highlighting inline
   * reactions.
   */
  replacedSubstrings?: ContentReplacedSubstringComponentInfo[]

  /**
   * A callback function that is called when all of the content substitutions
   * have been applied.
   */
  onContentReady?: (content: HTMLDivElement) => void;

  /**
   * If passed, will change the content style used in HoverPreviewLink.
   */
  contentStyleType?: ContentStyleType;
}

/**
 * Functions on a ContentItemBody that can be called if you have ref to one.
 */
export type ContentItemBodyImperative = {
  /**
   * Return whether a given node from the DOM is inside this ContentItemBody.
   * Used for checking the selection-anchor in a mouse event, for inline reacts.
   */
  containsNode: (node: Node) => boolean

  /**
   * Return a text stringified version of the contents (by stringifying from the
   * DOM). This is currently used only for warning that an inline-react
   * identifier is ambiguous; this isn't going to be nicely formatted and
   * shouldn't be presented to the user (for that, go to the source docuemnt and
   * get a markdown version).
   */
  getText: () => string

  getAnchorEl: () => HTMLDivElement|null
};

export type ContentReplacementMode = 'first' | 'all';

export type ContentReplacedSubstringComponentInfo = {
  replacedString: string
  componentName: 'JargonTooltip' | 'InlineReactHoverableHighlight',
  replace: ContentReplacementMode,
  caseInsensitive?: boolean,
  isRegex?: boolean,
  props: AnyBecauseHard
};

export const addNofollowToHTML = (html: string): string => {
  return html.replace(/<a /g, '<a rel="nofollow" ')
}
