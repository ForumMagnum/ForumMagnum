import { dataToMarkdown, dataToHTML, dataToCkEditor, buildRevision } from '../editor/conversionUtils'
import { getTagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import isEqual from 'lodash/isEqual';
import { userOwns, userIsAdmin } from '../../lib/vulcan-users/permissions';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/utils';
import gql from 'graphql-tag';
import { createRevision } from '../collections/revisions/mutations';
import { updateTag } from '../collections/tags/mutations';
import { resetHocuspocusDocument } from '../hocuspocus/hocuspocusCallbacks';
import { htmlToYjsStateFromHtml } from '../editor/htmlToYjsState';

export const revisionResolversGraphQLTypeDefs = gql`
  enum ConvertibleCollectionName {
    Posts
    Comments
    Tags
  }

  extend type Query {
    convertDocument(document: JSON, targetFormat: String): JSON
    latestGoogleDocMetadata(postId: String!, version: String): JSON
  }
  extend type Mutation {
    revertTagToRevision(tagId: String!, revertToRevisionId: String!): Tag
    convertDocumentEditorType(documentId: String!, collectionName: ConvertibleCollectionName!, fieldName: String!, document: JSON!, targetFormat: String!): JSON
  }
`;

export const revisionResolversGraphQLMutations = {
  revertTagToRevision: async (root: void, { tagId, revertToRevisionId }: { tagId: string, revertToRevisionId: string }, context: ResolverContext) => {
    const { currentUser, loaders, Tags } = context;
    if (!tagUserHasSufficientKarma(currentUser, 'edit')) {
      throw new Error(`Must be logged in and have ${getTagMinimumKarmaPermissions().edit} karma to revert tags to older revisions`);
    }

    const [tag, revertToRevision, latestRevision] = await Promise.all([
      loaders.Tags.load(tagId),
      loaders.Revisions.load(revertToRevisionId),
      getLatestRev(tagId, 'description', context)
    ]);

    const anyDiff = !isEqual(tag.description?.originalContents, revertToRevision.originalContents);

    if (!tag)               throw new Error('Invalid tagId');
    if (!revertToRevision)  throw new Error('Invalid revisionId');
    if (!revertToRevision.originalContents)
      throw new Error('Revision missing originalContents');
    // I don't think this should be possible if we find a revision to revert to, but...
    if (!latestRevision)    throw new Error('Tag is missing latest revision');
    if (!anyDiff)           throw new Error(`Can't find difference between revisions`);

    await updateTag({
      data: {
        description: {
          originalContents: revertToRevision.originalContents,
        },
      }, selector: { _id: tag._id }
    }, context);
  },
  convertDocumentEditorType: async (root: void, { documentId, collectionName, fieldName, document: sourceDocument, targetFormat }: { documentId: string, collectionName: ConvertibleCollectionName, fieldName: string, document: { type: string, value: string }, targetFormat: string }, context: ResolverContext) => {
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error('Must be logged in to convert editor type');
    }

    const collection: PgCollection<ConvertibleCollectionName> = context[collectionName];
    const dbDocument = await collection.findOne({ _id: documentId });
    if (!dbDocument) {
      throw new Error(`No ${collectionName} document with id: ${documentId}`);
    }

    if (!(userOwns(currentUser, dbDocument) || userIsAdmin(currentUser))) {
      throw new Error(`You don't have permission to edit this document`);
    }

    const { type: sourceType, value: sourceData } = sourceDocument;
    if (sourceType === targetFormat) {
      return true;
    }

    let convertedData: string;
    switch (targetFormat) {
      case "markdown":
        convertedData = dataToMarkdown(sourceData, sourceType);
        break;
      case "lexical":
        convertedData = await dataToHTML(sourceData, sourceType, context);
        break;
      case "html":
        convertedData = await dataToHTML(sourceData, sourceType, context);
        break;
      case "ckEditorMarkup":
        convertedData = await dataToCkEditor(sourceData, sourceType);
        break;
      default:
        throw new Error(`Unsupported target format: ${targetFormat}`);
    }

    const isDraft = 'draft' in dbDocument ? !!dbDocument.draft : true;
    const previousRev = await getLatestRev(documentId, fieldName, context);

    let yjsState: string | null = null;
    let yjsBinary: Uint8Array | null = null;
    if (targetFormat === 'lexical') {
      const yjs = await htmlToYjsStateFromHtml(convertedData);
      yjsBinary = yjs.yjsBinary;
      yjsState = yjs.yjsState;
    }

    const originalContents = { type: targetFormat, data: convertedData, yjsState };
    const nextVersion = getNextVersion(previousRev, 'minor', isDraft);

    const builtRevision = await buildRevision({
      originalContents,
      currentUser,
      context,
    });

    const newRevision: Partial<DbRevision> = {
      ...builtRevision,
      documentId,
      fieldName,
      collectionName,
      version: nextVersion,
      draft: isDraft,
      updateType: 'minor',
      changeMetrics: htmlToChangeMetrics(previousRev?.html || '', builtRevision.html),
      commitMessage: `Converted from ${sourceType} to ${targetFormat}`,
    };

    await createRevision({ data: newRevision }, context);

    // When converting to lexical on a post, push the new Yjs state to
    // Hocuspocus so any existing collaborative session is replaced with
    // the converted content (same as restoring a previous revision).
    if (collectionName === 'Posts' && fieldName === 'contents' && targetFormat === 'lexical' && yjsBinary) {
      await resetHocuspocusDocument(`post-${documentId}`, yjsBinary);
    }

    return true;
  },
}

export const revisionResolversGraphQLQueries = {
  convertDocument: async (root: void, {document, targetFormat}: {document: any, targetFormat: string}, context: ResolverContext) => {
    switch (targetFormat) {
      case "html":
        return {
          type: "html",
          value: await dataToHTML(document.value, document.type, context),
        };
        break;
      case "ckEditorMarkup":
        return {
          type: "ckEditorMarkup",
          value: await dataToCkEditor(document.value, document.type),
        };
        break;
      case "markdown":
        return {
          type: "markdown",
          value: dataToMarkdown(document.value, document.type),
        };
      case "lexical":
        // Lexical stores content as HTML internally, so convert to HTML
        return {
          type: "lexical",
          value: await dataToHTML(document.value, document.type, context),
        };
    }
  },
  latestGoogleDocMetadata: async (root: void, { postId, version }: { postId: string; version?: string }, { Revisions }: ResolverContext) => {
    const query = {
      documentId: postId,
      googleDocMetadata: { $exists: true },
      ...(version && { version: { $lte: version } }),
    };
    const latestRevisionWithMetadata = await Revisions.findOne(
      query,
      { sort: { editedAt: -1 } },
      { googleDocMetadata: 1 }
    );
    return latestRevisionWithMetadata ? latestRevisionWithMetadata.googleDocMetadata : null;
  },
}
