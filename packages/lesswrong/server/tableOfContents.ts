import { Comments } from '../lib/collections/comments/collection';
import { questionAnswersSortings } from '../lib/collections/comments/views';
import { postGetCommentCountStr } from '../lib/collections/posts/helpers';
import { Revisions } from '../lib/collections/revisions/collection';
import { answerTocExcerptFromHTML, truncate } from '../lib/editor/ellipsize';
import { isAF } from '../lib/instanceSettings';
import { Utils } from '../lib/vulcan-lib';
import { updateDenormalizedHtmlAttributions } from './tagging/updateDenormalizedHtmlAttributions';
import { annotateAuthors } from './attributeEdits';
import { getDefaultViewSelector } from '../lib/utils/viewUtils';
import { extractTableOfContents, ToCData, ToCSection } from '../lib/tableOfContents';
import { defineQuery } from './utils/serverGraphqlUtil';
import { htmlToTextDefault } from '../lib/htmlToText';
import { commentsTableOfContentsEnabled } from '../lib/betas';
import { parseDocumentFromString } from '../lib/domParser';

// Number of headings below which a table of contents won't be generated.
// If comments-ToC is enabled, this is 0 because we need a post-ToC (even if
// it's empty) to keep the horizontal position of things on the page from
// being imbalanced.
const MIN_HEADINGS_FOR_TOC = commentsTableOfContentsEnabled ? 0 : 1;


async function getTocAnswers (document: DbPost) {
  if (!document.question) return []

  let answersTerms: MongoSelector<DbComment> = {
    answer:true,
    postId: document._id,
    deleted:false,
  }
  if (isAF) {
    answersTerms.af = true
  }
  const answers = await Comments.find(answersTerms, {sort:questionAnswersSortings.top}).fetch();
  const answerSections: ToCSection[] = answers.map((answer: DbComment): ToCSection => {
    const { html = "" } = answer.contents || {}
    const highlight = truncate(html, 900)
    let shortHighlight = htmlToTextDefault(answerTocExcerptFromHTML(html));
    
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

async function getTocComments (document: DbPost) {
  const commentSelector: any = {
    ...getDefaultViewSelector("Comments"),
    answer: false,
    parentAnswerId: null,
    postId: document._id
  }
  if (document.af && isAF) {
    commentSelector.af = true
  }
  const commentCount = await Comments.find(commentSelector).count()
  return [{anchor:"comments", level:0, title: postGetCommentCountStr(document, commentCount)}]
}

export const getToCforPost = async ({document, version, context}: {
  document: DbPost,
  version: string|null,
  context: ResolverContext,
}): Promise<ToCData|null> => {
  let html: string;
  if (version) {
    const revision = await Revisions.findOne({documentId: document._id, version, fieldName: "contents"})
    if (!revision?.html) return null;
    if (!await Revisions.checkAccess(context.currentUser, revision, context))
      return null;
    html = revision.html;
  } else {
    html = document?.contents?.html;
  }
  
  const tableOfContents = extractTableOfContents(parseDocumentFromString(html))
  let tocSections = tableOfContents?.sections || []
  
  if (tocSections.length >= MIN_HEADINGS_FOR_TOC || document.question) {
    const tocAnswers = await getTocAnswers(document)
    const tocComments = await getTocComments(document)
    tocSections.push(...tocAnswers)
    tocSections.push(...tocComments)
  
    return {
      html: tableOfContents?.html||null,
      sections: tocSections,
    }
  }
  return null;
}

const getToCforTag = async ({document, version, context}: {
  document: DbTag,
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
      if (!revision?.html) return null;
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
  
  const tableOfContents = extractTableOfContents(parseDocumentFromString(html))
  let tocSections = tableOfContents?.sections || []
  
  return {
    html: tableOfContents?.html||null,
    sections: tocSections,
  }
}

Utils.getToCforPost = getToCforPost;
Utils.getToCforTag = getToCforTag;

/** @deprecated Use extractTableOfContents directly on the client instead. TODO delete after 2024-04-14 */
defineQuery({
  name: "generateTableOfContents",
  resultType: "JSON",
  argTypes: "(html: String!)",
  fn: (root: void, {html}: {html: string}, context: ResolverContext) => {
    if (html) {
      return extractTableOfContents(parseDocumentFromString(html))
    } else {
      return {html: null, sections: []}
    }
  }
})
