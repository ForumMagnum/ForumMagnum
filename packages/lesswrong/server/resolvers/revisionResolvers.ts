import { dataToMarkdown, dataToHTML, dataToCkEditor } from '../editor/conversionUtils'
import { defineMutation, defineQuery } from '../utils/serverGraphqlUtil';
import * as _ from 'underscore';
import { dataToDraftJS } from './toDraft';
import { tagMinimumKarmaPermissions, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { afterCreateRevisionCallback, buildRevision } from '../editor/make_editable_callbacks';
import isEqual from 'lodash/isEqual';
import { createMutator, updateMutator } from '../vulcan-lib/mutators';
import { EditorContents } from '../../components/editor/Editor';
import { userOwns } from '../../lib/vulcan-users/permissions';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/utils';

defineQuery({
  name: "convertDocument",
  resultType: "JSON",
  argTypes: "(document: JSON, targetFormat: String)",
  fn: async (root: void, {document, targetFormat}: {document: any, targetFormat: string}, context: ResolverContext) => {
    switch (targetFormat) {
      case "html":
        return {
          type: "html",
          value: await dataToHTML(document.value, document.type, context),
        };
        break;
      case "draftJS":
        return {
          type: "draftJS",
          value: dataToDraftJS(document.value, document.type)
        };
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
    }
  },
});

defineQuery({
  name: "latestGoogleDocMetadata",
  resultType: "JSON",
  argTypes: "(postId: String!, version: String)",
  fn: async (root: void, { postId, version }: { postId: string; version?: string }, context: ResolverContext) => {
    const { Revisions } = context;
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
});

defineMutation({
  name: "revertTagToRevision",
  resultType: "Tag",
  argTypes: "(tagId: String!, revertToRevisionId: String!)",
  fn: async (root: void, { tagId, revertToRevisionId }: { tagId: string, revertToRevisionId: string }, context: ResolverContext) => {
    const { currentUser, loaders, Tags } = context;
    if (!tagUserHasSufficientKarma(currentUser, 'edit')) {
      throw new Error(`Must be logged in and have ${tagMinimumKarmaPermissions['edit']} karma to revert tags to older revisions`);
    }

    const [tag, revertToRevision, latestRevision] = await Promise.all([
      loaders.Tags.load(tagId),
      loaders.Revisions.load(revertToRevisionId),
      getLatestRev(tagId, 'description', context)
    ]);

    const anyDiff = !isEqual(tag.description?.originalContents, revertToRevision.originalContents);

    if (!tag)               throw new Error('Invalid tagId');
    if (!revertToRevision)  throw new Error('Invalid revisionId');
    // I don't think this should be possible if we find a revision to revert to, but...
    if (!latestRevision)    throw new Error('Tag is missing latest revision');
    if (!anyDiff)           throw new Error(`Can't find difference between revisions`);

    await updateMutator({
      collection: Tags,
      context,
      documentId: tag._id,
      data: {
        description: {
          originalContents: revertToRevision.originalContents,
        },
      },
      currentUser,
    });
  }
});

defineMutation({
  name: "autosaveRevision",
  resultType: "Revision",
  schema: `
    input AutosaveContentType {
      type: String
      value: ContentTypeData
    }
  `,
  argTypes: "(postId: String!, contents: AutosaveContentType!)",
  fn: async (_, { postId, contents }: { postId: string, contents: EditorContents }, context): Promise<DbRevision> => {
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
        originalContents: { type: contents.type, data: contents.value },
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

    const { data: createdRevision } = await createMutator({
      collection: Revisions,
      document: newRevision,
      context,
      currentUser,
      validate: false
    });

    // TODO: not sure if we need these?  The aren't called by `saveDocumentRevision` in `ckEditorWebhook.ts` after creating a new revision from ckeditor's cloud autosave
    await afterCreateRevisionCallback.runCallbacksAsync([{ revisionID: createdRevision._id, context }]);

    return createdRevision;
  }
});
