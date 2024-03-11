import type { DOMWindow } from "jsdom";
import { commentsTableOfContentsEnabled } from "./betas";
import * as _ from 'underscore';
import { answerTocExcerptFromHTML, truncate } from "./editor/ellipsize";
import { htmlToTextDefault } from "./htmlToText";
import { postGetCommentCountStr } from "./collections/posts/helpers";

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
  offset?: number,
}

export interface ToCSectionWithOffset extends ToCSection {
  offset: number,
}

export interface ToCData {
  html: string | null,
  sections: ToCSection[],
}

// Number of headings below which a table of contents won't be generated.
// If comments-ToC is enabled, this is 0 because we need a post-ToC (even if
// it's empty) to keep the horizontal position of things on the page from
// being imbalanced.
export const MIN_HEADINGS_FOR_TOC = commentsTableOfContentsEnabled ? 0 : 1;

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
 * A window type that works with jsdom or the browser window
 */
type WindowType = DOMWindow | Window & typeof globalThis

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
  let headings: Array<ToCSection> = [];
  let usedAnchors: Record<string, boolean> = {};

  // First, find the headings in the document, create a linear list of them,
  // and insert anchors at each one.
  let headingElements = document.querySelectorAll(headingSelector);
  headingElements.forEach((element) => {
    if (!(element instanceof window.HTMLElement)) {
      return;
    }
    let tagName = element.tagName.toLowerCase();
    if (tagIsHeadingIfWholeParagraph(tagName) && !tagIsWholeParagraph({ element, window })) {
      return;
    }

    let title = element.textContent?.trim();
    if (title && title !== "") {
      let anchor = titleToAnchor(title, usedAnchors);
      usedAnchors[anchor] = true;
      element.id = anchor;
      headings.push({
        title: title,
        anchor: anchor,
        level: tagToHeadingLevel(tagName),
      });
    }
  });

  // Filter out unused heading levels, mapping the heading levels to consecutive
  // numbers starting from 1.
  let headingLevelsUsedDict: Partial<Record<number, boolean>> = {};
  headings.forEach((heading) => {
    headingLevelsUsedDict[heading.level] = true;
  });

  let headingLevelsUsed = Object.keys(headingLevelsUsedDict).map(Number).sort();
  let headingLevelMap: Record<number, number> = {};
  headingLevelsUsed.forEach((level, index) => {
    headingLevelMap[level] = index + 1;
  });

  headings.forEach((heading) => {
    heading.level = headingLevelMap[heading.level];
  });

  if (headings.length) {
    headings.push({ divider: true, level: 0, anchor: "postHeadingsDivider" });
  }

  return {
    // TODO check that this is the right html, although I think it isn't used
    html: document.body.innerHTML,
    sections: headings,
  };
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

async function getTocComments({ post, comments }: { post: DbPost | PostsListWithVotes; comments: CommentType[] }) {
  return [{ anchor: "comments", level: 0, title: postGetCommentCountStr(post, comments.length) }];
}

/**
 * `<b>` and `<strong>` tags are considered headings if and only if they are the only element within their paragraph.
 */
function tagIsWholeParagraph({ element, window }: { element: AnyBecauseIsInput; window: WindowType }): boolean {
  if (!(element instanceof window.HTMLElement)) {
    throw new Error("element must be HTMLElement");
  }

  // Ensure the element's parent is a 'p' tag
  const parent = element.parentElement;
  if (!parent || parent.tagName.toLowerCase() !== "p") {
    return false;
  }

  // Check if the element is the only element within the paragraph
  // and that there is no significant text directly within the paragraph
  const isOnlyElement = Array.from(parent.childNodes).every((child) => {
    // Allow the element itself or other elements with the same tag name
    if (child === element || (child instanceof window.HTMLElement && child.tagName === element.tagName)) {
      return true;
    }
    // Allow whitespace text nodes
    if (child.nodeType === window.Node.TEXT_NODE && child.textContent?.trim() === "") {
      return true;
    }
    return false;
  });

  return isOnlyElement;
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
