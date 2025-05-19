import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { captureException } from '@sentry/core';
import HoverPreviewLink, { linkIsExcludedFromPreview } from '../linkPreview/HoverPreviewLink';
import { toRange } from '../../lib/vendor/dom-anchor-text-quote';
import { rawExtractElementChildrenToReactComponent, reduceRangeToText, splitRangeIntoReplaceableSubRanges, wrapRangeWithSpan } from '../../lib/utils/rawDom';
import { captureEvent } from '../../lib/analyticsEvents';
import { hasCollapsedFootnotes } from '@/lib/betas';
import { ConditionalVisibilitySettings } from '../editor/conditionalVisibilityBlock/conditionalVisibility';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { validateUrl } from "../../lib/vulcan-lib/utils";
import type { ContentStyleType } from './ContentStyles';
import JargonTooltip from '../jargon/JargonTooltip';
import InlineReactHoverableHighlight from '../votes/lwReactions/InlineReactHoverableHighlight';
import ConditionalVisibilityBlockDisplay from "../editor/conditionalVisibilityBlock/ConditionalVisibilityBlockDisplay";
import CollapsedFootnotes from "../posts/PostsPage/CollapsedFootnotes";
import ElicitBlock from "../posts/ElicitBlock";
import { WrappedStrawPoll } from "./WrappedStrawPoll";
import ForumEventPostPagePollSection from "../forumEvents/ForumEventPostPagePollSection";
import { shallowEqualExcept } from '@/lib/utils/componentUtils';
import { HorizScrollBlock } from './HorizScrollBlock';

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

interface ElementReplacement {
  replacementElement: React.ReactNode
  container: HTMLElement
}

const ContentItemBody = forwardRef((props: ContentItemBodyProps, ref) => {
  const [lastProps, setLastProps] = useState(() => props);
  const [lastRenderIndex, setLastRenderIndex] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [replacedElements, setReplacedElements] = useState<Array<{
    replacementElement: React.ReactNode
    container: HTMLElement
  }>>([]);
  const html = props.nofollow
    ? addNofollowToHTML(props.dangerouslySetInnerHTML.__html)
    : props.dangerouslySetInnerHTML.__html;
  
  function compareProps(oldProps: ContentItemBodyProps, newProps: ContentItemBodyProps) {
    if (!shallowEqualExcept(oldProps, newProps, ["ref", "dangerouslySetInnerHTML", "replacedSubstrings"])) {
      return false;
    }
    if (oldProps.dangerouslySetInnerHTML.__html !== newProps.dangerouslySetInnerHTML.__html) {
      return false;
    }
    return true;
  }
  const propsChanged = !compareProps(lastProps, props);
  const renderIndex = propsChanged ? lastRenderIndex+1 : lastRenderIndex;

  useImperativeHandle(ref, () => ({
    containsNode: (node: Node): boolean => {
      return !!bodyRef.current?.contains(node);
    },
    getText: (): string => {
      return bodyRef.current?.textContent ?? ""
    },
    getAnchorEl: (): HTMLDivElement|null => {
      return bodyRef.current;
    },
  }));
  
  const contentsDiv = useMemo(() => <div
    key={renderIndex}
    className={props.className}
    ref={bodyRef}
    dangerouslySetInnerHTML={{__html: html}}
  // This should only rerender when renderIndex increments
  // eslint-disable-next-line react-hooks/exhaustive-deps
  />, [html, renderIndex]);

  useLayoutEffect(() => {
    if (bodyRef.current) {
      setReplacedElements(applyLocalModificationsTo(bodyRef.current, {
        replacedSubstrings: props.replacedSubstrings,
        idInsertions: props.idInsertions,
        description: props.description,
        noHoverPreviewPrefetch: props.noHoverPreviewPrefetch,
        contentStyleType: props.contentStyleType,
      }));
      setLastProps(props);
      setLastRenderIndex(renderIndex);
    }
  // This should only rerun when renderIndex increments
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renderIndex]);
  
  return <>
    {contentsDiv}
    {replacedElements.map(replaced => ReactDOM.createPortal(replaced.replacementElement, replaced.container))}
  </>
});


export const addNofollowToHTML = (html: string): string => {
  return html.replace(/<a /g, '<a rel="nofollow" ')
}

/**
 * Given an HTMLCollection, return an array of the elements inside it. Note
 * that this is covering for a browser-specific incompatibility: in Edge 17
 * and earlier, HTMLCollection has `length` and `item` but isn't iterable.
 */
function htmlCollectionToArray(collection: HTMLCollectionOf<HTMLElement>): HTMLElement[] {
  if (!collection) return [];
  let ret: Array<HTMLElement> = [];
  for (let i=0; i<collection.length; i++)
    ret.push(collection.item(i)!);
  return ret;
}

/**
 * Find elements inside the contents with the given classname, and return them
 * as an array.
 */
function getElementsByClassname(element: HTMLElement, classname: string): HTMLElement[] {
  const elementCollection = element.getElementsByClassName(classname);
  
  if (!elementCollection) return [];
  
  let ret: Array<HTMLElement> = [];
  for (let i=0; i<elementCollection.length; i++) {
    // Downcast Element->HTMLElement because the HTMLCollectionOf type doesn't
    // know that getElementsByClassName only returns elements, not text
    // nodes/etc
    ret.push(elementCollection.item(i) as HTMLElement);
  }
  return ret;
}


/**
 * Applies transformations to a DOM subtree (modifying it in-place, replacing
 * elements), and returns a list of containers/elements to be used as portals.
 */
function applyLocalModificationsTo(element: HTMLElement, options: {
  replacedSubstrings?: ContentReplacedSubstringComponentInfo[]
  idInsertions?: Record<string, React.ReactNode>;
  description?: string;
  noHoverPreviewPrefetch?: boolean;
  contentStyleType?: ContentStyleType;
}) {
  const { replacedSubstrings, idInsertions, description, noHoverPreviewPrefetch, contentStyleType } = options;
  try {
    const replacements: ElementReplacement[] = [
      // Replace substrings (for inline reacts and glossary) goes first,
      // because it can split elements that other substitutions work on (in
      // particular it can split an <a> tag into two).
      ...(replacedSubstrings ? replaceSubstrings(element, replacedSubstrings, {description: description}) : []),

      ...addCTAButtonEventListeners(element),
      ...replaceForumEventPollPlaceholders(element),

      ...markScrollableBlocks(element),
      ...collapseFootnotes(element),
      ...markHoverableLinks(element, {
        description: description,
        noHoverPreviewPrefetch: noHoverPreviewPrefetch,
        contentStyleType: contentStyleType,
      }),
      ...markElicitBlocks(element),
      ...wrapStrawPoll(element),
      ...applyIdInsertions(element, idInsertions),
      ...exposeInternalIds(element),
      ...markConditionallyVisibleBlocks(element),
    ];
    return replacements;
  } catch(e) {
    // Don't let exceptions escape from here. This ensures that, if client-side
    // modifications crash, the post/comment text still remains visible.
    captureException(e);
    // eslint-disable-next-line no-console
    console.error(e);
  }
  return [];
}


// Find elements that are too wide, and wrap them in HorizScrollBlock.
// This is client-only because it requires measuring widths.
function markScrollableBlocks(element: HTMLElement) {
  let replacements: ElementReplacement[] = [];
  // Iterate through top-level (block) elements, checking their width. If any
  // of them overflow the container, they'll get replaced by a
  // ScrollableBlock.
  const allTopLevelBlocks = element.childNodes;
  for (let i=0; i<allTopLevelBlocks.length; i++) {
    const block = allTopLevelBlocks[i];
    if (block.nodeType === Node.ELEMENT_NODE) {
      const blockAsElement = block as HTMLElement;
      
      // Only do this for <p>, <div>, and <table> tags (in practice this is
      // most top-level blocks, but not the <ol> that wraps footnotes)
      if (!['P','DIV','TABLE'].includes(blockAsElement.tagName))
        continue;
      
      // Check whether this block is wider than the content-block it's inside
      // of, and if so, wrap it in a horizontal scroller. This makes wide
      // LaTeX formulas and tables functional on mobile.
      // We also need to check that this element has nonzero width, because of
      // an odd bug in Firefox where, when you open a tab in the background,
      // it runs JS but doesn't do page layout (or does page layout as-if the
      // page was zero width?) Without this check, you would sometimes get a
      // spurious horizontal scroller on every paragraph-block.
      if (blockAsElement.scrollWidth > element.clientWidth+1 && element.clientWidth > 0)
      {
        addHorizontalScrollIndicators(replacements, blockAsElement);
      }
    }
  }
  return replacements;
}

function markConditionallyVisibleBlocks(element: HTMLElement) {
  const conditionallyVisibleBlocks = getElementsByClassname(element, "conditionallyVisibleBlock");
  let replacements: ElementReplacement[] = [];
  for (const block of conditionallyVisibleBlocks) {
    const visibilityOptionsStr = block.getAttribute("data-visibility");
    if (!visibilityOptionsStr) continue;
    let visibilityOptions: ConditionalVisibilitySettings|null = null;
    try {
      visibilityOptions = JSON.parse(visibilityOptionsStr)
    } catch {
      continue;
    }

    const BlockContents = rawExtractElementChildrenToReactComponent(block)
    replaceElement(replacements, block, <ConditionalVisibilityBlockDisplay options={visibilityOptions!}>
      <BlockContents/>
    </ConditionalVisibilityBlockDisplay>);
  }
  return replacements;
}

// Given an HTML block element which has horizontal scroll, wrap it in a
// <HorizScrollBlock>.
function addHorizontalScrollIndicators(replacements: ElementReplacement[], block: HTMLElement) {
  const ScrollableContents = rawExtractElementChildrenToReactComponent(block)
  replaceElement(replacements, block, <HorizScrollBlock>
    <ScrollableContents/>
  </HorizScrollBlock>);
};

function forwardAttributes(node: HTMLElement|Element) {
  const result: Record<string, unknown> = {};
  const attrs = node.attributes ?? [];
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i];
    if (attr.name === "class") {
      result.className = attr.value;
    } else {
      result[attr.name] = attr.value;
    }
  }
  return result;
}


function collapseFootnotes(body: HTMLElement) {
  if (!hasCollapsedFootnotes || !body) {
    return [];
  }
  let replacements: ElementReplacement[] = [];

  const footnotes = body.querySelector(".footnotes");
  if (footnotes) {
    let innerHTML = footnotes.innerHTML;
    if (footnotes.tagName !== "SECTION") {
      innerHTML = `<section>${innerHTML}</section>`;
    }
    const collapsedFootnotes = (
      <CollapsedFootnotes
        footnotesHtml={innerHTML}
        attributes={forwardAttributes(footnotes)}
      />
    );
    replaceElement(replacements, footnotes, collapsedFootnotes);
  }
  return replacements;
}

function markHoverableLinks(element: HTMLElement, options: {description?: string, noHoverPreviewPrefetch?: boolean, contentStyleType?: ContentStyleType}) {
  let replacements: ElementReplacement[] = [];
  const linkTags = htmlCollectionToArray(element.getElementsByTagName("a"));
  for (let linkTag of linkTags) {
    const href = linkTag.getAttribute("href");
    if (!href || linkIsExcludedFromPreview(href) || linkTag.classList.contains('ck-cta-button'))
      continue;

    const TagLinkContents = rawExtractElementChildrenToReactComponent(linkTag);
    const id = linkTag.getAttribute("id") ?? undefined;
    const rel = linkTag.getAttribute("rel") ?? undefined;
    const replacementElement = <HoverPreviewLink
      href={href}
      contentSourceDescription={options.description}
      id={id}
      rel={rel}
      noPrefetch={options.noHoverPreviewPrefetch}
      contentStyleType={options.contentStyleType}
    >
      <TagLinkContents/>
    </HoverPreviewLink>
    replaceElement(replacements, linkTag, replacementElement);
  }
  return replacements;
}

function markElicitBlocks(element: HTMLElement) {
  let replacements: ElementReplacement[] = [];
  const elicitBlocks = getElementsByClassname(element, "elicit-binary-prediction");
  for (const elicitBlock of elicitBlocks) {
    if (elicitBlock.dataset?.elicitId) {
      const replacementElement = <ElicitBlock questionId={elicitBlock.dataset.elicitId}/>
      replaceElement(replacements, elicitBlock, replacementElement)
    }
  }
  return replacements;
}

/**
 * Find embedded Strawpoll blocks (an iframe integration to a polling site),
 * and replace them with WrappedStrawPoll, which causes them to be a request
 * to log in if you aren't logged in. See the StrawPoll block in `embedConfig`
 * in `editorConfigs.js` (compiled into the CkEditor bundle). The DOM
 * structure of the embed looks like:
 *
 *   <div class="strawpoll-embed" id="strawpoll_{pollId}>
 *     <iframe src="https://strawppoll.com/embed/polls/{pollId}"></iframe>
 *   </div>
 *
 * (FIXME: The embed-HTML in editorConfigs also has a bunch of stuff in it
 * that's unnecessary, which is destined to get stripped out by the HTML
 * validator)
 */
function wrapStrawPoll(element: HTMLElement) {
  const strawpollBlocks = getElementsByClassname(element, "strawpoll-embed");
  let replacements: ElementReplacement[] = [];
  for (const strawpollBlock of strawpollBlocks) {
    const id = strawpollBlock.getAttribute("id");
    const iframe = strawpollBlock.getElementsByTagName("iframe");
    const iframeSrc = iframe[0]?.getAttribute("src") ?? "";
    const replacementElement = <WrappedStrawPoll id={id} src={iframeSrc} />
    replaceElement(replacements, strawpollBlock, replacementElement)
  }

  return replacements;
}

/**
 * CTA buttons added in ckeditor need the following things doing to make them fully functional:
 * - Convert data-href to href
 * - Add analytics to button clicks
 */
function addCTAButtonEventListeners(element: HTMLElement) {
  const ctaButtons = element.getElementsByClassName('ck-cta-button');

  for (let i = 0; i < ctaButtons.length; i++) {
    const button = ctaButtons[i] as HTMLAnchorElement;
    const dataHref = button.getAttribute('data-href');
    if (dataHref) {
      button.setAttribute('href', validateUrl(dataHref));
    }
    button.addEventListener('click', () => {
      captureEvent("ctaButtonClicked", {href: dataHref})
    })
  }
  return [];
}

function replaceForumEventPollPlaceholders(element: HTMLElement) {
  let replacements: ElementReplacement[] = [];
  const pollPlaceholders = element.getElementsByClassName('ck-poll');

  const forumEventIds = Array.from(pollPlaceholders).map(placeholder => ({
    placeholder,
    forumEventId: placeholder.getAttribute('data-internal-id')
  }));

  for (const { placeholder, forumEventId } of forumEventIds) {
    if (!forumEventId) continue;

    // Create the poll element with styling and context
    const pollElement = <ForumEventPostPagePollSection id={forumEventId} forumEventId={forumEventId} />;

    replaceElement(replacements, placeholder, pollElement);
  }

  return replacements;
}

function replaceSubstrings(
  element: HTMLElement,
  replacedSubstrings: ContentReplacedSubstringComponentInfo[],
  options: {
    description?: string,
  },
): ElementReplacement[] {
  if (!replacedSubstrings) return [];
  let replacements: ElementReplacement[] = [];

  // Sort substrings by length descending to handle overlapping substrings
  const sortedSubstrings = replacedSubstrings.sort((a, b) => b.replacedString.length - a.replacedString.length);

  for (let replacement of sortedSubstrings) {
    if (replacement.replace === "all") {
      const ReplacementComponent = replacementComponentMap[replacement.componentName];
      const replacementComponentProps = replacement.props;
      
      try {
        // Collect all ranges to replace in document order
        const rangesToReplace: { range: Range; isFirst: boolean }[] = [];
        let isFirst = true;

        const collectRanges = (node: Node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            let textContent = node.textContent || "";
            
            // Helper function to check if a character is part of a word
            const isWordChar = (char: string) => /[\p{L}\p{N}'-]/u.test(char);
            
            // Helper function to process a potential match
            const processMatch = (index: number, matchLength: number, isFirst: boolean) => {
              const prevChar = textContent[index - 1];
              const nextChar = textContent[index + matchLength];
              
              const isPrevBoundary = !prevChar || !isWordChar(prevChar);
              const isNextBoundary = !nextChar || !isWordChar(nextChar);

              if (isPrevBoundary && isNextBoundary) {
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + matchLength);
                
                rangesToReplace.push({ range, isFirst });
                return true;
              }
              return false;
            };
            
            if (replacement.isRegex) {
              // Use regex for patterns with alternates
              const pattern = new RegExp(`(${replacement.replacedString.trim()})`, replacement.caseInsensitive ? 'gi' : 'g');
              let match;
              while ((match = pattern.exec(textContent)) !== null) {
                if (processMatch(match.index, match[0].length, isFirst)) {
                  isFirst = false;
                }
              }
            } else {
              // Use indexOf for simple string searches
              const searchString = replacement.replacedString.trim();
              const searchStringLower = replacement.caseInsensitive ? searchString.toLowerCase() : searchString;
              const textContentForSearch = replacement.caseInsensitive ? textContent.toLowerCase() : textContent;
              
              let index = textContentForSearch.indexOf(searchStringLower);
              while (index !== -1) {
                if (processMatch(index, searchString.length, isFirst)) {
                  isFirst = false;
                }
                index = textContentForSearch.indexOf(searchStringLower, index + 1);
              }
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            node.childNodes.forEach(child => collectRanges(child));
          }
        };

        collectRanges(element);

        // Replace from the end to avoid index shifting
        rangesToReplace
          .reverse()
          .forEach(({ range, isFirst }) => {
            const span = wrapRangeWithSpan(range);
            if (span) {
              const WrappedSpan = rawExtractElementChildrenToReactComponent(span);
              const replacementNode = (
                <ReplacementComponent
                  {...replacementComponentProps}
                  replacedSubstrings={replacedSubstrings}
                  isFirstOccurrence={isFirst}
                >
                  <WrappedSpan />
                </ReplacementComponent>
              );
              replaceElement(replacements, span, replacementNode);
            }
          });

      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(`Error highlighting string ${replacement.replacedString} in ${options.description ?? "content block"}`, e);
      }
    } else {
      const ReplacementComponent = replacementComponentMap[replacement.componentName];
      const replacementComponentProps = replacement.props;
      const str = replacement.replacedString;

      try {
        // Find (the first instance of) the string to replace. This should be
        // an HTML text node plus an offset into that node.
        //
        // We're using the dom-anchor-text-quote library for this search,
        // which is a thin wrapper around diff-match-patch, which is a diffing
        // library with a full suite of fuzzy matching heuristics.
        const range: Range|null = toRange(
          element,
          { exact: str.trim() },
          { hint: 0 }, //TODO: store offsets with text, make use for resolving match ambiguity
        );
        // Do surgery on the DOM
        if (range) {
          const reduced = reduceRangeToText(range);
          if (!reduced) continue;
          const subRanges = splitRangeIntoReplaceableSubRanges(reduced);
          let first=true;
          for (let subRange of subRanges) {
            const reducedRange = reduceRangeToText(subRange);
            if (reducedRange) {
              const span = wrapRangeWithSpan(reducedRange)
              if (span) {
                const InlineReactedSpan = rawExtractElementChildrenToReactComponent(span);
                const replacementNode = (
                  <ReplacementComponent {...replacementComponentProps} isSplitContinuation={!first}>
                    <InlineReactedSpan/>
                  </ReplacementComponent>
                );
                replaceElement(replacements, span, replacementNode);
              }
            }
            first=false;
          }
        }
      } catch {
        // eslint-disable-next-line no-console
        console.error(`Error highlighting string ${str} in ${options.description ?? "content block"}`);
      }
    }
  }
  
  return replacements;
}

function applyIdInsertions(element: HTMLElement, idInsertions?: Record<string, React.ReactNode>) {
  if (!idInsertions) return [];
  let replacements: ElementReplacement[] = [];

  for (let id of Object.keys(idInsertions)) {
    const addedElement = idInsertions[id];
    const container = document.getElementById(id);
    // TODO: Check that it's inside this ContentItemBody
    if (container) insertElement(replacements, container, <>{addedElement}</>);
  }
  return replacements;
}

/**
 * Convert data-internal-id to id, handling duplicates
 */
function exposeInternalIds(element: HTMLElement) {
  const elementsWithDataInternalId = element.querySelectorAll('[data-internal-id]');
  elementsWithDataInternalId.forEach((el: Element) => {
    const internalId = el.getAttribute('data-internal-id');
    if (internalId && !document.getElementById(internalId)) {
      if (!el.id) {
        el.id = internalId;
      } else {
        const wrapperSpan = document.createElement('span');
        wrapperSpan.id = internalId;
        while (el.firstChild) {
          wrapperSpan.appendChild(el.firstChild);
        }
        el.appendChild(wrapperSpan);
      }
    }
  });
  return [];
}

function replaceElement(replacements: ElementReplacement[], replacedElement: HTMLElement|Element, replacementElement: React.ReactNode) {
  const replacementContainer = document.createElement("span");
  if (replacementContainer) {
    replacements.push({
      replacementElement: replacementElement,
      container: replacementContainer,
    });
    replacedElement.parentElement?.replaceChild(replacementContainer, replacedElement);
  }
}

function insertElement(replacements: ElementReplacement[], container: HTMLElement, insertedElement: React.ReactNode) {
  const insertionContainer = document.createElement("span");
  replacements.push({
    replacementElement: insertedElement,
    container: insertionContainer,
  });
  container.prepend(insertionContainer);
}

export default registerComponent("ContentItemBody", ContentItemBody, {
  // NOTE: Because this takes a ref, it can only use HoCs that will forward that ref.
  allowRef: true,
});



