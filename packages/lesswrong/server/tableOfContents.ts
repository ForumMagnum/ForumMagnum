import { CommentsViews, questionAnswersSortings } from '../lib/collections/comments/views';
import { updateDenormalizedHtmlAttributions, UpdateDenormalizedHtmlAttributionsOptions } from './tagging/updateDenormalizedHtmlAttributions';
import { annotateAuthors } from './attributeEdits';
import { getDefaultViewSelector } from '../lib/utils/viewUtils';
import { extractTableOfContents, getTocAnswers, getTocComments, shouldShowTableOfContents, ToCData } from '../lib/tableOfContents';
import { parseDocumentFromString } from '../lib/domParser';
import { getLatestContentsRevision } from './collections/revisions/helpers';
import { applyCustomArbitalScripts } from './utils/arbital/arbitalCustomScripts';
import { isEditableField } from './editor/isEditableField';
import { getCollectionAccessFilter } from './permissions/accessFilters';

async function getTocAnswersServer(document: DbPost, context: ResolverContext) {
  const { Comments } = context;

  if (!document.question) return []

  let answersTerms: MongoSelector<DbComment> = {
    answer:true,
    postId: document._id,
    draft: false,
    deleted:false,
  }
  if (context.forumType === "AlignmentForum") {
    answersTerms.af = true
  }
  const answers = await Comments.find(answersTerms, {sort:questionAnswersSortings.top}).fetch();
  return getTocAnswers({post: document, answers})
}

async function getTocCommentsServer(document: DbPost, context: ResolverContext) {
  const { Comments } = context;

  const commentSelector: any = {
    ...getDefaultViewSelector(CommentsViews),
    answer: false,
    draft: false,
    parentAnswerId: null,
    postId: document._id
  }
  if (document.af && context.forumType === "AlignmentForum") {
    commentSelector.af = true
  }
  const commentCount = await Comments.find(commentSelector).count()
  return getTocComments({post: document, commentCount})
}

async function getHtmlWithContributorAnnotations({
  document,
  collectionName,
  fieldName,
  version,
  context,
}: UpdateDenormalizedHtmlAttributionsOptions & {
  version: string | null,
  context: ResolverContext,
}) {
  const { Revisions, [collectionName]: collection } = context;

  if (!isEditableField([fieldName, collection.schema[fieldName]])) {
    // eslint-disable-next-line no-console
    console.log(`Author annotation failed: Field ${fieldName} not in editableCollectionsFields[${collectionName}]`);
    return null;
  }

  if (version) {
    try {
      const html = await annotateAuthors(document._id, collectionName, fieldName, context, version);
      return html;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Author annotation failed");
      // eslint-disable-next-line no-console
      console.log(e);
      const revision = await Revisions.findOne({ documentId: document._id, version, fieldName });
      if (!revision?.html) return null;
      const checkAccess = getCollectionAccessFilter('Revisions');
      if (!await checkAccess(context.currentUser, revision, context))
        return null;
      return revision.html;
    }
  } else {
    try {
      if (document.htmlWithContributorAnnotations) {
        return document.htmlWithContributorAnnotations;
      } else {
        const updateOptions: UpdateDenormalizedHtmlAttributionsOptions = collectionName === 'Tags'
          ? {document, collectionName: 'Tags', fieldName: 'description', context}
          : {document, collectionName: 'MultiDocuments', fieldName: 'contents', context};
        const html = await updateDenormalizedHtmlAttributions(updateOptions);
        return html;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log("Author annotation failed");
      // eslint-disable-next-line no-console
      console.log(e);
      // already validated fieldName is in editableCollectionsFields[collectionName]
      return (document as any)[fieldName]?.html ?? "";
    }
  }
}

export const getToCforPost = async ({document, version, context}: {
  document: DbPost | (PostsHTML & DbPost),
  version: string|null,
  context: ResolverContext,
}): Promise<ToCData|null> => {
  const { Revisions } = context;

  let html: string;
  if (version) {
    const revision = await Revisions.findOne({documentId: document._id, version, fieldName: "contents"})
    if (!revision?.html) return null;
    const checkAccess = getCollectionAccessFilter('Revisions');
    if (!await checkAccess(context.currentUser, revision, context))
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
    const tocAnswers = await getTocAnswersServer(document, context)
    const tocComments = await getTocCommentsServer(document, context)
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
  html = await getHtmlWithContributorAnnotations({
    document,
    collectionName: 'Tags',
    fieldName: 'description',
    version,
    context,
  });

  if (!html) return { html, sections: [] };

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
  html = await getHtmlWithContributorAnnotations({
    document,
    collectionName: 'MultiDocuments',
    fieldName: 'contents',
    version,
    context,
  });

  if (!html) return { html, sections: [] };

  html = await applyCustomArbitalScripts(html);
  
  const tableOfContents = extractTableOfContents(parseDocumentFromString(html))
  let tocSections = tableOfContents?.sections || []
  
  return {
    html: tableOfContents?.html||null,
    sections: tocSections,
  }
}
