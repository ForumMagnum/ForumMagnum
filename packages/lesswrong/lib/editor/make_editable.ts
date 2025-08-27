import { documentIsNotDeleted, userOwns } from '../vulcan-users/permissions';
import { getOriginalContents } from '../collections/revisions/helpers';
import { accessFilterMultiple } from '../utils/schemaUtils';
import { getWithLoader } from '../loaders';
import type { MakeEditableOptions } from './makeEditableOptions';
import { getCollectionAccessFilter } from '@/server/permissions/accessFilters';
import { getDefaultEditorPlaceholder } from './defaultEditorPlaceholder';

const defaultOptions: MakeEditableOptions<CollectionNameString> = {
  // Determines whether to use the comment editor configuration (e.g. Toolbars)
  commentEditor: false,
  // Determines whether to use the comment editor styles (e.g. Fonts)
  commentStyles: false,
  // Determines whether to use the comment local storage restoration system
  commentLocalStorage: false,
  // Given a document and a field name, return:
  // {
  //   id: The name to use for storing drafts related to this document in
  //     localStorage. This may be combined with an editor-type prefix.
  //   verify: Whether to prompt before restoring a draft (as opposed to just
  //     always restoring it).
  // }
  getLocalStorageId: null,
  permissions: {
    canRead: [documentIsNotDeleted],
    canUpdate: [userOwns, 'sunshineRegiment', 'admins'],
    canCreate: ['members']
  },
  order: 0,
  hintText: () => getDefaultEditorPlaceholder(),
  pingbacks: false,
  revisionsHaveCommitMessages: false,
}

export function getNormalizedEditableResolver<N extends CollectionNameString>(fieldName: string) {
  return async function normalizedEditableResolver(
    doc: ObjectsByCollectionName[N],
    args: {version?: string},
    context: ResolverContext,
  ): Promise<DbRevision|null> {
    const {currentUser, Revisions} = context;
    const checkAccess = getCollectionAccessFilter('Revisions');

    let revision: DbRevision|null;
    if (args.version) {
      revision = await Revisions.findOne({
        documentId: doc._id,
        version: args.version,
        fieldName,
      });
    } else {
      const revisionId = doc[`${fieldName}_latest` as keyof ObjectsByCollectionName[N]] as string;
      if (revisionId) {
        revision = await context.loaders.Revisions.load(revisionId);
      } else {
        revision = null;
      }
    }
    return (revision && await checkAccess(currentUser, revision, context))
      ? revision
      : null;
  }
}

export function getNormalizedEditableSqlResolver<N extends CollectionNameString>(fieldName: string) {
  return function normalizedEditableSqlResolver({field, resolverArg, join}: SqlResolverArgs<N>) {
    return join({
      table: "Revisions",
      type: "left",
      /**
       * WARNING: we manually interpolate `fieldName` into the SQL query below.
       * In this case it's safe because we control the value of `fieldName` (though we need to take care not to allow the creation of an editable field name with e.g. any escape characters),
       * and it'd be pretty annoying to pass it in as an argument given how the dynamic sql construction works.
       * But you should not do this kind of thing elsewhere, as a rule.
       */
      on: (revisionField) => `CASE WHEN ${resolverArg("version")} IS NULL
        THEN
          ${field(`${fieldName}_latest` as FieldName<N>)} = ${revisionField("_id")}
        WHEN ${resolverArg("version")} = 'draft' THEN
          ${revisionField("_id")} = (SELECT _id FROM "Revisions" WHERE "documentId" = ${field("_id")} AND "fieldName" = '${fieldName}' ORDER BY "editedAt" DESC LIMIT 1)
        ELSE
          ${resolverArg("version")} = ${revisionField("version")} AND
          ${field("_id")} = ${revisionField("documentId")}
        END
      `,
      resolver: (revisionField) => revisionField("*"),
    });
  }
}

export function getDenormalizedEditableResolver<N extends CollectionNameString>(collectionName: N, fieldName: string) {
  return async function denormalizedEditableResolver(
    doc: ObjectsByCollectionName[N],
    {version}: {version?: string},
    context: ResolverContext,
  ): Promise<DbRevision|null> {
    const {currentUser, Revisions} = context;
    if (version) {
      const checkAccess = getCollectionAccessFilter('Revisions');
      if (version === "draft") {
        // If version is the special string "draft", that means
        // instead of returning the latest non-draft version
        // (what we'd normally do), we instead return the latest
        // version period, including draft versions.
        const revision = await Revisions.findOne({
          documentId: doc._id,
          fieldName,
        }, {sort: {editedAt: -1}});
        return revision && await checkAccess(currentUser, revision, context)
          ? revision
          : null;
      } else {
        const revision = await Revisions.findOne({
          documentId: doc._id,
          version,
          fieldName,
        });
        return revision && await checkAccess(currentUser, revision, context)
          ? revision
          : null;
      }
    }

    const typedFieldName = fieldName as keyof ObjectsByCollectionName[N];
    const docField = doc[typedFieldName] as EditableFieldContents;
    if (!docField) {
      return null;
    }

    const result = {
      ...docField,
      // we're specifying these fields manually because docField doesn't have
      // them, or because we need to control the permissions on them.
      // The reason we need to return documentId and collectionName is because
      // this entire result gets recursively resolved by revision field
      // resolvers, and those resolvers depend on these fields existing.
      _id: `${doc._id}_${fieldName}`, //HACK
      documentId: doc._id,
      collectionName,
      editedAt: new Date(docField?.editedAt ?? Date.now()),
      originalContents: await getOriginalContents(
        context.currentUser,
        doc,
        docField.originalContents,
        context,
      ),
    } as DbRevision;
    // HACK: Pretend that this denormalized field is a DbRevision (even though
    // it's missing an _id and some other fields)
    return result
  }
}

export function getRevisionsResolver(fieldName: string) {
  return async function revisionsResolver<N extends CollectionNameString>(
    post: ObjectsByCollectionName[N],
    args: {limit: number},
    context: ResolverContext,
  ) {
    const { limit } = args;
    const { currentUser, Revisions } = context;

    // getWithLoader is used here to fix a performance bug for a particularly nasty bot which resolves `revisions` for thousands of comments.
    // Previously, this would cause a query for every comment whereas now it only causes one (admittedly quite slow) query
    const loaderResults = await getWithLoader(
      context,
      Revisions,
      `revisionsByDocumentId_${fieldName}_${limit}`,
      {fieldName},
      "documentId",
      post._id,
      {sort: {editedAt: -1}, limit},
    );

    return await accessFilterMultiple(currentUser, 'Revisions', loaderResults, context);
  }
}

export function getNormalizedVersionResolver(fieldName: string) {
  return async function versionResolver<N extends CollectionNameString>(doc: ObjectsByCollectionName[N], args: void, context: ResolverContext): Promise<string | null> {
    const revisionId = doc[`${fieldName}_latest` as keyof ObjectsByCollectionName[N]] as string;
    let revision;
    if (revisionId) {
      revision = await context.loaders.Revisions.load(revisionId);
    }
    return revision?.version ?? null;
  }
}
