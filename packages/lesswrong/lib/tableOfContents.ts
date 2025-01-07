import { commentsTableOfContentsEnabled } from "./betas";
import * as _ from 'underscore';
import { answerTocExcerptFromHTML, truncate } from "./editor/ellipsize";
import { htmlToTextDefault } from "./htmlToText";
import type { WindowType } from "./domParser";
import { PostWithCommentCounts, postGetCommentCountStr } from "./collections/posts/helpers";
import { isLWorAF } from "./instanceSettings";

export interface ToCAnswer {
  baseScore: number,
  voteCount: number,
  postedAt: Date | string, // Date on server, string on client
  author: string | null,
  highlight: string,
  shortHighlight: string,
}

export interface AnchorOffset {
  anchorHref: string | null,
  offset: number
}

export interface ToCSection {
  title?: string,
  answer?: ToCAnswer,
  anchor: string,
  level: number,
  divider?: boolean,
  
  /**
   * The y-position of the anchor that corresponds to this ToC entry, relative
   * to the top of the page. Used to determine which heading is highlighted.
   */
  offset?: number,
  
  /**
   * If a variable-height ToC is in use, the relative vertical size of this
   * section
   */
  scale?: number,
}

export interface ToCSectionWithOffset extends ToCSection {
  offset: number,
}

export interface ToCSectionWithOffsetAndScale extends ToCSectionWithOffset {
  scale: number,
}

export interface ToCData {
  html: string | null,
  sections: ToCSection[],
}

// Number of headings below which a table of contents won't be generated.
// If comments-ToC is enabled, this is 0 because we need a post-ToC (even if
// it's empty) to keep the horizontal position of things on the page from
// being imbalanced.
const MIN_HEADINGS_FOR_TOC = commentsTableOfContentsEnabled ? 0 : 1;

// Tags which define headings. Currently <h1>-<h4>, <strong>, and <b>. Excludes
// <h5> and <h6> because their usage in historical (HTML) wasn't as a ToC-
// worthy heading.
const headingTags = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  // <b> and <strong> are at the same level
  strong: 7,
  b: 7,
}

const headingIfWholeParagraph = {
  strong: true,
  b: true,
};

const headingSelector = _.keys(headingTags).join(",");

/**
 * Given an HTML document, extract a list of sections for a table of contents
 * from it, and add anchors. The result is modified HTML with added anchors,
 * plus a JSON array of sections, where each section has a
 * `title`, `anchor`, and `level`, like this:
 *   {
 *     html: "<a anchor=...">,
 *     sections: [
 *       {title: "Preamble", anchor: "preamble", level: 1},
 *       {title: "My Cool Idea", anchor: "mycoolidea", level: 1},
 *         {title: "An Aspect of My Cool Idea", anchor:"anaspectofmycoolidea", level: 2},
 *         {title: "Why This Is Neat", anchor:"whythisisneat", level: 2},
 *       {title: "Conclusion", anchor: "conclusion", level: 1},
 *     ]
 *   }
 */
export function extractTableOfContents({
  document,
  window,
}: {
  document: Document;
  window: WindowType;
}): ToCData | null {
  if (!document.body.innerHTML) return null;

  let headings: Array<ToCSection> = [];
  let usedAnchors: Record<string, boolean> = {};

  // First, find the headings in the document, create a linear list of them,
  // and insert anchors at each one.
  let headingElements = document.querySelectorAll(headingSelector);
  for (const element of Array.from(headingElements)) {
    if (!(element instanceof window.HTMLElement)) {
      continue;
    }
    let tagName = element.tagName.toLowerCase();
    if (tagIsHeadingIfWholeParagraph(tagName) && !tagIsWholeParagraph({ element, window })) {
      continue;
    }

    // Get title from element text
    let title = elementToToCTitle(element);
    // Cap the length at 300 chars
    if (title.length > 300) {
      title = title.substring(0, 300) + '...';
    }

    if (title && title.trim() !== "") {
      let anchor = titleToAnchor(title, usedAnchors);
      usedAnchors[anchor] = true;
      element.id = anchor;
      headings.push({
        title: title,
        anchor: anchor,
        level: tagToHeadingLevel(tagName),
      });
    }
  }

  // Filter out unused heading levels, mapping the heading levels to consecutive
  // numbers starting from 1.
  let headingLevelsUsedDict: Partial<Record<number, boolean>> = {};
  for (const heading of headings) {
    headingLevelsUsedDict[heading.level] = true;
  }

  let headingLevelsUsed = Object.keys(headingLevelsUsedDict).map(Number).sort();
  let headingLevelMap: Record<number, number> = {};
  for (const [i, level] of headingLevelsUsed.entries()) {
    headingLevelMap[level] = i + 1;
  }

  for (const heading of headings) {
    heading.level = headingLevelMap[heading.level];
  }

  if (headings.length) {
    headings.push({ divider: true, level: 0, anchor: "postHeadingsDivider" });
  }

  return {
    html: document.body.innerHTML,
    sections: headings,
  };
}

/**
 * Generate a (string) section heading from a heading element. This means
 * taking text from text nodes (with element.textContent), except with a
 * special case to make sure `<style>` nodes aren't included. This comes up
 * if the MathJax stylesheet happens to be in the same block as the heading,
 * which happens if the heading contains the first usage of LaTeX in the post.
 * (eg: https://www.lesswrong.com/s/Gmc7vtnpyKZRHWdt5/p/tCex9F9YptGMpk2sT)
 */
function elementToToCTitle(element: HTMLElement): string {
  // Check whether there's a <style> element. Usually there isn't.
  const styleSelector = element.querySelector("style");
  if (styleSelector) {
    // If there's a <style>, clone the subtree, then remove style nodes from the clone
    const elementClone: HTMLElement = element.cloneNode(true) as HTMLElement; //pass true to make the copy be deep
    const cloneStyleSelector = elementClone.querySelectorAll("style");
    cloneStyleSelector.forEach(i => i.remove());
    return elementClone.textContent ?? "";
  } else {
    return element.textContent ?? "";
  }
}

type CommentType = CommentsList | DbComment
export function getTocAnswers({ post, answers }: { post: { question: boolean }; answers: CommentType[] }) {
  if (!post.question) return []

  const answerSections: ToCSection[] = answers.map((answer: CommentType): ToCSection => {
    const { html = "" } = answer.contents || {};
    const highlight = truncate(html, 900);
    let shortHighlight = htmlToTextDefault(answerTocExcerptFromHTML(html));
    const author = ("user" in answer ? answer.user?.displayName : answer.author) ?? null;

    return {
      title: `${answer.baseScore} ${author}`,
      answer: {
        baseScore: answer.baseScore,
        voteCount: answer.voteCount,
        postedAt: answer.postedAt,
        author: author,
        highlight,
        shortHighlight,
      },
      anchor: answer._id,
      level: 2,
    };
  });

  if (answerSections.length) {
    return [
      { anchor: "answers", level: 1, title: "Answers" },
      ...answerSections,
      { divider: true, level: 0, anchor: "postAnswersDivider" },
    ];
  } else {
    return [];
  }
}

export function getTocComments({
  post,
  commentCount,
}: { post?: PostWithCommentCounts | null; commentCount?: number | undefined } = {}) {
  return [{ anchor: "comments", level: 0, title: postGetCommentCountStr(post, commentCount) }];
}

export function shouldShowTableOfContents({
  sections,
  post,
}: {
  sections: ToCSection[];
  post?: { question: boolean } | null;
}): boolean {
  
  if (isLWorAF) return true;
  return sections.length > MIN_HEADINGS_FOR_TOC || (post?.question ?? false);
}

/**
 * `<b>` and `<strong>` tags are considered headings if and only if they are the only element within their paragraph.
 */
function tagIsWholeParagraph({ element, window }: { element: HTMLElement; window: WindowType }): boolean {
  if (!(element instanceof window.HTMLElement)) {
    throw new Error("element must be HTMLElement");
  }

  const parent = element.parentNode;
  if (!parent) {
    return false;
  }

  // Check if the element is the only significant content within the paragraph
  const selfAndSiblings = Array.from(parent.childNodes);
  // TODO only count as an alien if there is text content in a sibling that is not under a <strong> tag
  // E.g. in <p><strong>Visit our </strong><a href="..."><strong>website</strong></a> the whole thing
  // should count as a heading because it's a continuous block of bold text making up a full paragraph.
  // Supporting this naturally would require refactoring for this function to be paragraph level, rather than
  // tag-level (as the two <strongs> in the above example would currently trigger separate invokations).
  const alienFound = selfAndSiblings.some((sibling) => {
    if (sibling.nodeType === window.Node.ELEMENT_NODE && sibling !== element) {
      const siblingElement = sibling as HTMLElement;
      // Check if the sibling is of a different type
      if (siblingElement.tagName !== element.tagName) {
        return true;
      }
      // Check if the sibling contains significant text that is not part of the element
      if (siblingElement.textContent?.trim() && !element.contains(siblingElement)) {
        return true;
      }
    } else if (sibling.nodeType === window.Node.TEXT_NODE && sibling.textContent?.trim()) {
      // Check if it's a text node with non-whitespace content
      return true;
    }
    return false;
  });

  // If an alien element was found, it's not a whole paragraph tag
  if (alienFound) {
    return false;
  }

  // Ensure that all the text in the paragraph is within elements of the same type as our element
  const para = element.closest('p');
  return !!para && para.textContent?.trim() === element.textContent?.trim();
};

/**
 * `<b>` and `<strong>` tags are headings iff they are the only thing in their
 * paragraph. Return whether the given tag name is a tag with that property
 * (ie, is `<strong>` or `<b>`).
 * See tagIsWholeParagraph
 */
function tagIsHeadingIfWholeParagraph(tagName: string): boolean
{
  return tagName.toLowerCase() in headingIfWholeParagraph;
}

const reservedAnchorNames = ["top", "comments"];

/**
 * Given the text in a heading block and a dict of anchors that have been used
 * in the post so far, generate an anchor, and return it. An anchor is a
 * URL-safe string that can be used for within-document links, and which is
 * not one of a few reserved anchor names.
 */
function titleToAnchor(title: string, usedAnchors: Record<string,boolean>): string
{
  let charsToUse = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789";
  let sb: Array<string> = [];

  for(let i=0; i<title.length; i++) {
    let ch = title.charAt(i);
    if(charsToUse.indexOf(ch) >= 0) {
      sb.push(ch);
    } else {
      sb.push('_');
    }
  }

  let anchor = sb.join('');
  if(!usedAnchors[anchor] && !_.find(reservedAnchorNames, x=>x===anchor))
    return anchor;

  let anchorSuffix = 1;
  while(usedAnchors[anchor + anchorSuffix])
    anchorSuffix++;
  return anchor+anchorSuffix;
}

function tagToHeadingLevel(tagName: string): number
{
  let lowerCaseTagName = tagName.toLowerCase();
  if (lowerCaseTagName in headingTags)
    return headingTags[lowerCaseTagName as keyof typeof headingTags];
  else if (lowerCaseTagName in headingIfWholeParagraph)
    // Comment below from Robert, ported from server/tableOfContents:
    // TODO: this seems wrong??? It's returning a boolean when it should be returning a number
    // @ts-ignore
    return headingIfWholeParagraph[lowerCaseTagName as keyof typeof headingIfWholeParagraph];
  else
    return 0;
}
