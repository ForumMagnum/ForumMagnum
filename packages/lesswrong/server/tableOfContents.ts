import cheerio from 'cheerio';
import { htmlToText } from 'html-to-text';
import * as _ from 'underscore';
import { cheerioParse } from './utils/htmlUtil';
import { Comments } from '../lib/collections/comments/collection';
import { questionAnswersSortings } from '../lib/collections/comments/views';
import { postGetCommentCountStr } from '../lib/collections/posts/helpers';
import { Revisions } from '../lib/collections/revisions/collection';
import { answerTocExcerptFromHTML, truncate } from '../lib/editor/ellipsize';
import { forumTypeSetting } from '../lib/instanceSettings';
import { Utils } from '../lib/vulcan-lib';
import { updateDenormalizedHtmlAttributions } from './tagging/updateDenormalizedHtmlAttributions';
import { annotateAuthors } from './attributeEdits';
import { getDefaultViewSelector } from '../lib/utils/viewUtils';
import type { ToCData, ToCSection } from '../lib/tableOfContents';
import { defineQuery } from './utils/serverGraphqlUtil';
import GraphQLJSON from 'graphql-type-json';

// Number of headings below which a table of contents won't be generated.
const MIN_HEADINGS_FOR_TOC = 3;

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
export function extractTableOfContents(postHTML: string)
{
  if (!postHTML) return null;
  const postBody = cheerioParse(postHTML);
  let headings: Array<ToCSection> = [];
  let usedAnchors: Record<string,boolean> = {};

  // First, find the headings in the document, create a linear list of them,
  // and insert anchors at each one.
  let headingTags = postBody(headingSelector);
  for (let i=0; i<headingTags.length; i++) {
    let tag = headingTags[i];

    if (tag.type !== "tag") {
      continue;
    }
    if (tagIsHeadingIfWholeParagraph(tag.tagName) && !tagIsWholeParagraph(tag)) {
      continue;
    }

    let title = elementToToCText(tag);
    
    if (title && title.trim()!=="") {
      let anchor = titleToAnchor(title, usedAnchors);
      usedAnchors[anchor] = true;
      cheerio(tag).attr("id", anchor);
      headings.push({
        title: title,
        anchor: anchor,
        level: tagToHeadingLevel(tag.tagName),
      });
    }
  }

  // Filter out unused heading levels, mapping the heading levels to consecutive
  // numbers starting from 1. So if a post uses <h1>, <h3> and <strong>, those
  // will be levels 1, 2, and 3 (not 1, 3 and 7).

  // Get a list of heading levels used
  let headingLevelsUsedDict: Partial<Record<number,boolean>> = {};
  for(let i=0; i<headings.length; i++)
    headingLevelsUsedDict[headings[i].level] = true;

  // Generate a mapping from raw heading levels to compressed heading levels
  let headingLevelsUsed = _.keys(headingLevelsUsedDict).sort();
  let headingLevelMap: Record<string, number> = {};
  for(let i=0; i<headingLevelsUsed.length; i++)
    headingLevelMap[ headingLevelsUsed[i] ] = i;

  // Mark sections with compressed heading levels
  for(let i=0; i<headings.length; i++)
    headings[i].level = headingLevelMap[headings[i].level]+1;

  if (headings.length) {
    headings.push({divider:true, level: 0, anchor: "postHeadingsDivider"})
  }
  return {
    html: postBody.html(),
    sections: headings,
    headingsCount: headings.length
  }
}

function elementToToCText(cheerioTag: cheerio.Element) {
  const tagHtml = cheerio(cheerioTag).html();
  if (!tagHtml) return null;
  const tagClone = cheerioParse(tagHtml);
  tagClone("style").remove();
  return tagClone.root().text();
}

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

// `<b>` and `<strong>` tags are headings iff they are the only thing in their
// paragraph. Return whether the given tag name is a tag with that property
// (ie, is `<strong>` or `<b>`).
// See tagIsWholeParagraph
function tagIsHeadingIfWholeParagraph(tagName: string): boolean
{
  return tagName.toLowerCase() in headingIfWholeParagraph;
}

const tagIsAlien = (baseTag: cheerio.TagElement, potentialAlienTag: cheerio.Element): boolean => {
  switch (potentialAlienTag.type) {
    case 'tag':
      return baseTag.name !== potentialAlienTag.name;
    case 'text':
      return (potentialAlienTag.data?.trim().length ?? 0) > 0;
    default:
      return true;
  }
}

// `<b>` and `<strong>` tags are headings iff they are the only thing in their
// paragraph. Return whether or not the given cheerio tag satisfies these heuristics.
// See tagIsHeadingIfWholeParagraph
const tagIsWholeParagraph = (tag?: cheerio.TagElement): boolean => {
  if (!tag) {
    return false;
  }

  // Ensure the tag's parent is valid
  const parents = cheerio(tag).parent();
  if (!parents || !parents.length || parents[0].type !== 'tag') {
    return false;
  }

  // Ensure that all of the tag's siblings are of the same type as the tag
  const selfAndSiblings = cheerio(parents[0]).contents();
  if (selfAndSiblings.toArray().find((elem) => tagIsAlien(tag, elem))) {
    return false;
  }

  // Ensure that the tag is inside a 'p' element and that all the text in that 'p' is in tags of
  // the same type as our base tag
  const para = cheerio(tag).closest('p');
  if (para.length < 1 || para.text().trim() !== para.find(tag.name).text().trim()) {
    return false;
  }

  return true;
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

async function getTocAnswers (document: Pick<DbPost, '_id' | 'question'>) {
  if (!document.question) return []

  let answersTerms: MongoSelector<DbComment> = {
    answer:true,
    postId: document._id,
    deleted:false,
  }
  if (forumTypeSetting.get() === 'AlignmentForum') {
    answersTerms.af = true
  }
  const answers = await Comments.find(answersTerms, {sort:questionAnswersSortings.top}).fetch();
  const answerSections: ToCSection[] = answers.map((answer: DbComment): ToCSection => {
    const { html = "" } = answer.contents || {}
    const highlight = truncate(html, 900)
    let shortHighlight = htmlToText(answerTocExcerptFromHTML(html), {selectors: [ { selector: 'img', format: 'skip' }, { selector: 'a', options: { ignoreHref: true } } ]})
    
    return {
      title: `${answer.baseScore} ${answer.author}`,
      answer: {
        baseScore: answer.baseScore,
        voteCount: answer.voteCount,
        postedAt: answer.postedAt,
        author: answer.author,
        highlight, shortHighlight,
      },
      anchor: answer._id,
      level: 2
    };
  })

  if (answerSections.length) {
    return [
      {anchor: "answers", level:1, title:'Answers'}, 
      ...answerSections,
      {divider:true, level: 0, anchor: "postAnswersDivider"}
    ]
  } else {
    return []
  }
}

async function getTocComments (document: Pick<DbPost, '_id' | 'af' | 'commentCount' | 'afCommentCount'>) {
  const commentSelector: any = {
    ...getDefaultViewSelector("Comments"),
    answer: false,
    parentAnswerId: null,
    postId: document._id
  }
  if (document.af && forumTypeSetting.get() === 'AlignmentForum') {
    commentSelector.af = true
  }
  const commentCount = await Comments.find(commentSelector).count()
  return [{anchor:"comments", level:0, title: postGetCommentCountStr(document, commentCount)}]
}

export const getToCforPost = async ({document, version, context}: {
  document: Pick<DbPost, '_id' | 'contents' | 'question' | 'af' | 'commentCount' | 'afCommentCount'>,
  version: string|null,
  context: ResolverContext,
}): Promise<ToCData|null> => {
  let html: string;
  if (version) {
    const revision = await Revisions.findOne({documentId: document._id, version, fieldName: "contents"})
    if (!revision) return null;
    if (!await Revisions.checkAccess(context.currentUser, revision, context))
      return null;
    html = revision.html;
  } else {
    html = document?.contents?.html;
  }
  
  const tableOfContents = extractTableOfContents(html)
  let tocSections = tableOfContents?.sections || []
  
  if (tocSections.length >= MIN_HEADINGS_FOR_TOC) {
    const tocAnswers = await getTocAnswers(document)
    const tocComments = await getTocComments(document)
    tocSections.push(...tocAnswers)
    tocSections.push(...tocComments)
  
    return {
      html: tableOfContents?.html||null,
      sections: tocSections,
      headingsCount: tocSections.length
    }
  }
  return null;
}

const getToCforTag = async ({document, version, context}: {
  document: Pick<DbTag, '_id' | 'htmlWithContributorAnnotations' | 'description'>,
  version: string|null,
  context: ResolverContext,
}): Promise<ToCData|null> => {
  let html: string;
  if (version) {
    try {
      html = await annotateAuthors(document._id, "Tags", "description", version);
    } catch(e) {
      // eslint-disable-next-line no-console
      console.log("Author annotation failed");
      // eslint-disable-next-line no-console
      console.log(e);
      const revision = await Revisions.findOne({documentId: document._id, version, fieldName: "description"})
      if (!revision) return null;
      if (!await Revisions.checkAccess(context.currentUser, revision, context))
        return null;
      html = revision.html;
    }
  } else {
    try {
      if (document.htmlWithContributorAnnotations) {
        html = document.htmlWithContributorAnnotations;
      } else {
        html = await updateDenormalizedHtmlAttributions(document);
      }
    } catch(e) {
      // eslint-disable-next-line no-console
      console.log("Author annotation failed");
      // eslint-disable-next-line no-console
      console.log(e);
      html = document.description?.html;
    }
  }
  
  const tableOfContents = extractTableOfContents(html)
  let tocSections = tableOfContents?.sections || []
  
  return {
    html: tableOfContents?.html||null,
    sections: tocSections,
    headingsCount: tocSections.length
  }
}

Utils.getToCforPost = getToCforPost;
Utils.getToCforTag = getToCforTag;

defineQuery({
  name: "generateTableOfContents",
  resultType: "JSON",
  argTypes: "(html: String!)",
  fn: (root: void, {html}:{html:string}, context: ResolverContext) => {
    if (html) {
      return extractTableOfContents(html)
    } else {
      return {html: null, sections: [], headingsCount: 0}
    }
  }
})
