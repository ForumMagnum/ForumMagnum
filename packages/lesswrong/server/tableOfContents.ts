import { Comments } from '../lib/collections/comments/collection';
import { questionAnswersSortings } from '../lib/collections/comments/views';
import { Revisions } from '../lib/collections/revisions/collection';
import { isAF } from '../lib/instanceSettings';
import { updateDenormalizedHtmlAttributions } from './tagging/updateDenormalizedHtmlAttributions';
import { annotateAuthors } from './attributeEdits';
import { getDefaultViewSelector } from '../lib/utils/viewUtils';
import { extractTableOfContents, getTocAnswers, getTocComments, shouldShowTableOfContents, ToCData } from '../lib/tableOfContents';
import { defineQuery } from './utils/serverGraphqlUtil';
import { parseDocumentFromString } from '../lib/domParser';
import { FetchedFragment } from './fetchFragment';
import { getLatestContentsRevision } from '../lib/collections/revisions/helpers';
import { applyCustomArbitalScripts } from './utils/arbital/arbitalCustomScripts';

async function getTocAnswersServer (document: DbPost) {
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
  return getTocAnswers({post: document, answers})
}

async function getTocCommentsServer (document: DbPost) {
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
  return getTocComments({post: document, commentCount})
}

export const getToCforPost = async ({document, version, context}: {
  document: DbPost|FetchedFragment<"PostsHTML">,
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
  } else if ("contents" in document && document.contents) {
    html = document?.contents?.html ?? "";
  } else {
    const revision = await getLatestContentsRevision(document, context);
    html = revision?.html ?? "";
  }

  const tableOfContents = extractTableOfContents(parseDocumentFromString(html))
  let tocSections = tableOfContents?.sections || []
  
  if (shouldShowTableOfContents({ sections: tocSections, post: document })) {
    const tocAnswers = await getTocAnswersServer(document)
    const tocComments = await getTocCommentsServer(document)
    tocSections.push(...tocAnswers)
    tocSections.push(...tocComments)
  
    return {
      html: tableOfContents?.html||null,
      sections: tocSections,
    }
  }
  return null;
}

export const getToCforTag = async ({document, version, context}: {
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
      html = document.description?.html ?? "";
    }
  }

  html = await applyCustomArbitalScripts(html);
  
  const tableOfContents = extractTableOfContents(parseDocumentFromString(html))
  let tocSections = tableOfContents?.sections || []
  
  return {
    html: tableOfContents?.html||null,
    sections: tocSections,
  }
}

export const getToCforMultiDocument = async ({document, version, context}: {
  document: DbMultiDocument,
  version: string|null,
  context: ResolverContext,
}): Promise<ToCData | null> => {
  let html: string;
  if (version) {
    try {
      html = await annotateAuthors(document._id, "MultiDocuments", "contents", version);
    } catch(e) {
      // eslint-disable-next-line no-console
      console.log("Author annotation failed");
      // eslint-disable-next-line no-console
      console.log(e);
      const revision = await Revisions.findOne({documentId: document._id, version, fieldName: "contents"})
      if (!revision?.html) return null;
      if (!await Revisions.checkAccess(context.currentUser, revision, context))
        return null;
      html = revision.html;
    }
  } else {
    try {
      // TODO: figure out how to denormalize the contributor annotations for multi-documents (like we do for tags); this probably isn't performant
      html = await annotateAuthors(document._id, "MultiDocuments", "contents");
    } catch(e) {
      // eslint-disable-next-line no-console
      console.log("Author annotation failed");
      // eslint-disable-next-line no-console
      console.log(e);
      const revision = await getLatestContentsRevision(document, context);
      html = revision?.html ?? "";
    }
  }

  html = await applyCustomArbitalScripts(html);
  
  const tableOfContents = extractTableOfContents(parseDocumentFromString(html))
  let tocSections = tableOfContents?.sections || []
  
  return {
    html: tableOfContents?.html||null,
    sections: tocSections,
  }
}

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
