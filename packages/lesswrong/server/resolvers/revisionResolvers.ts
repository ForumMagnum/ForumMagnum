import { dataToMarkdown, dataToHTML, dataToCkEditor, buildRevision } from '../editor/conversionUtils'
import { getTagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import isEqual from 'lodash/isEqual';
import { EditorContents } from '../../components/editor/Editor';
import { userOwns, userIsAdmin } from '../../lib/vulcan-users/permissions';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/utils';
import gql from 'graphql-tag';
import { createRevision } from '../collections/revisions/mutations';
import { updateTag } from '../collections/tags/mutations';
import { resetHocuspocusDocument } from '../hocuspocus/hocuspocusCallbacks';

export const revisionResolversGraphQLTypeDefs = gql`
  input AutosaveContentType {
    type: String
    value: ContentTypeData
  }

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
    autosaveRevision(postId: String!, contents: AutosaveContentType!): Revision
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
  autosaveRevision: async (root: void, { postId, contents }: { postId: string, contents: EditorContents }, context: ResolverContext) => {
    const { currentUser, loaders, Revisions } = context;
    if (!currentUser) {
      throw new Error('Cannot autosave revision while logged out');
    }

    const post = await loaders.Posts.load(postId);
    if (!userOwns(currentUser, post)) {
      throw new Error('Must be post author to autosave');
    }

    const postContentsFieldName = 'contents';
    const updateSemverType = 'patch';

    const [previousRev, html] = await Promise.all([
      getLatestRev(postId, postContentsFieldName, context),
      dataToHTML(contents.value, contents.type, context, { sanitize: !currentUser.isAdmin })
    ]);

    // This behavior differs from make_editable's `updateBefore` callback, but in the case of manual user saves it seems fine to create new revisions; they don't happen that often
    // In principle we shouldn't be getting autosave requests from the client when there's no diff, but seems better to avoid creating spurious revisions for autosaves
    // (especially if there's a bug on the client which causes the client-side diff-checking to fail)
    if (previousRev && isEqual(previousRev.originalContents, contents)) {
      return previousRev;
    }

    const nextVersion = getNextVersion(previousRev, updateSemverType, post.draft);
    const changeMetrics = htmlToChangeMetrics(previousRev?.html || "", html);

    const newRevision: Partial<DbRevision> = {
      ...await buildRevision({
        originalContents: { type: contents.type, data: contents.value, yjsState: null },
        currentUser,
        context,
      }),
      documentId: postId,
      fieldName: postContentsFieldName,
      collectionName: 'Posts',
      version: nextVersion,
      draft: true,
      updateType: updateSemverType,
      changeMetrics,
      commitMessage: 'Native editor autosave',
    };

    const createdRevision = await createRevision({
      data: newRevision
    }, context);

    return createdRevision;
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
    
    if (!userOwns(currentUser, dbDocument) || !userIsAdmin(currentUser)) {
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

    // When converting to lexical, generate the Yjs binary state from the HTML
    // so the collaborative document can be properly initialized.
    // Inline import: htmlToYjsBinary transitively imports PlaygroundNodes which
    // pulls in CSS files that break the codegen CJS loader.
    let yjsState: string | null = null;
    let yjsBinary: Uint8Array | null = null;
    if (targetFormat === 'lexical') {
      const { htmlToYjsBinary } = await import('../editor/htmlToYjsBinary');
      yjsBinary = htmlToYjsBinary(convertedData);
      yjsState = Buffer.from(yjsBinary).toString('base64');
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
