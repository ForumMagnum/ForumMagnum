import type { DOMWindow } from "jsdom";
import { commentsTableOfContentsEnabled } from "./betas";
import * as _ from 'underscore';

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
  headingsCount: number,
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

// Given an HTML document, extract a list of sections for a table of contents
// from it, and add anchors. The result is modified HTML with added anchors,
// plus a JSON array of sections, where each section has a
// `title`, `anchor`, and `level`, like this:
//   {
//     html: "<a anchor=...">,
//     sections: [
//       {title: "Preamble", anchor: "preamble", level: 1},
//       {title: "My Cool Idea", anchor: "mycoolidea", level: 1},
//         {title: "An Aspect of My Cool Idea", anchor:"anaspectofmycoolidea", level: 2},
//         {title: "Why This Is Neat", anchor:"whythisisneat", level: 2},
//       {title: "Conclusion", anchor: "conclusion", level: 1},
//     ]
//   }
export function extractTableOfContents({ document, window }: { document: Document; window: DOMWindow }): ToCData | null {
  // `<b>` and `<strong>` tags are headings iff they are the only thing in their
  // paragraph.
  const tagIsWholeParagraph = (element: AnyBecauseIsInput): boolean => {
    if (!(element instanceof window.HTMLElement)) {
      throw new Error("element must be HTMLElement")
    }
    // Ensure the element's parent is a 'p' tag
    const parent = element.parentElement;
    if (!parent || parent.tagName.toLowerCase() !== 'p') {
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
      if (child.nodeType === window.Node.TEXT_NODE && child.textContent?.trim() === '') {
        return true;
      }
      // Disallow anything else
      return false;
    });

    return isOnlyElement;
  }

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
    if (tagIsHeadingIfWholeParagraph(tagName) && !tagIsWholeParagraph(element)) {
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
  headings.forEach(heading => {
    headingLevelsUsedDict[heading.level] = true;
  });

  let headingLevelsUsed = Object.keys(headingLevelsUsedDict).map(Number).sort();
  let headingLevelMap: Record<number, number> = {};
  headingLevelsUsed.forEach((level, index) => {
    headingLevelMap[level] = index + 1;
  });

  headings.forEach(heading => {
    heading.level = headingLevelMap[heading.level];
  });

  if (headings.length) {
    headings.push({ divider: true, level: 0, anchor: "postHeadingsDivider" });
  }

  return {
    html: document.body.innerHTML,
    sections: headings,
    headingsCount: headings.length
  };
}

// `<b>` and `<strong>` tags are headings iff they are the only thing in their
// paragraph. Return whether the given tag name is a tag with that property
// (ie, is `<strong>` or `<b>`).
// See tagIsWholeParagraph
function tagIsHeadingIfWholeParagraph(tagName: string): boolean
{
  return tagName.toLowerCase() in headingIfWholeParagraph;
}

// `<b>` and `<strong>` tags are headings iff they are the only thing in their
// paragraph. Return whether or not the given cheerio tag satisfies these heuristics.
// See tagIsHeadingIfWholeParagraph
// const tagIsWholeParagraph = (tag?: cheerio.TagElement): boolean => {
//   if (!tag) {
//     return false;
//   }

//   // Ensure the tag's parent is valid
//   const parents = cheerio(tag).parent();
//   if (!parents || !parents.length || parents[0].type !== 'tag') {
//     return false;
//   }

//   // Ensure that all of the tag's siblings are of the same type as the tag
//   const selfAndSiblings = cheerio(parents[0]).contents();
//   if (selfAndSiblings.toArray().find((elem) => tagIsAlien(tag, elem))) {
//     return false;
//   }

//   // Ensure that the tag is inside a 'p' element and that all the text in that 'p' is in tags of
//   // the same type as our base tag
//   const para = cheerio(tag).closest('p');
//   if (para.length < 1 || para.text().trim() !== para.find(tag.name).text().trim()) {
//     return false;
//   }

//   return true;
// }

// // `<b>` and `<strong>` tags are headings iff they are the only thing in their
// // paragraph.
// // TODO this doesn't quite match the original
// const tagIsWholeParagraph = ({ element }: { element: HTMLElement; }): boolean => {
//   // Ensure the element's parent is a 'p' tag
//   const parent = element.parentElement;
//   if (!parent || parent.tagName.toLowerCase() !== 'p') {
//     return false;
//   }

//   // Check if the element is the only element within the paragraph
//   // and that there is no significant text directly within the paragraph
//   const isOnlyElement = Array.from(parent.childNodes).every((child) => {
//     // Allow the element itself or other elements with the same tag name
//     if (child === element || (child instanceof HTMLElement && child.tagName === element.tagName)) {
//       return true;
//     }
//     // Allow whitespace text nodes
//     if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim() === '') {
//       return true;
//     }
//     // Disallow anything else
//     return false;
//   });

//   return isOnlyElement;
// }

const reservedAnchorNames = ["top", "comments"];

// Given the text in a heading block and a dict of anchors that have been used
// in the post so far, generate an anchor, and return it. An anchor is a
// URL-safe string that can be used for within-document links, and which is
// not one of a few reserved anchor names.
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
    // TODO: this seems wrong??? It's returning a boolean when it should be returning a number
    // @ts-ignore
    return headingIfWholeParagraph[lowerCaseTagName as keyof typeof headingIfWholeParagraph];
  else
    return 0;
}
