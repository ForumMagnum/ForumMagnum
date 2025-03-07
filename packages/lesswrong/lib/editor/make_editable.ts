import { documentIsNotDeleted, userOwns } from '../vulcan-users/permissions';
import { camelCaseify } from '../vulcan-lib/utils';
import { ContentType, getOriginalContents } from '../collections/revisions/schema'
import { accessFilterMultiple } from '../utils/schemaUtils';
import SimpleSchema from 'simpl-schema'
import { getWithLoader } from '../loaders';
import { isFriendlyUI } from '../../themes/forumTheme';
import type { EditableFieldCallbackOptions, EditableFieldClientOptions, EditableFieldName, EditableFieldOptions, MakeEditableOptions } from './makeEditableOptions';

export const RevisionStorageType = new SimpleSchema({
  originalContents: {type: ContentType, optional: true},
  userId: {type: String, optional: true},
  commitMessage: {type: String, optional: true},
  html: {type: String, optional: true, denormalized: true},
  updateType: {type: String, optional: true, allowedValues: ['initial', 'patch', 'minor', 'major']},
  version: {type: String, optional: true},
  editedAt: {type: Date, optional: true},
  wordCount: {type: SimpleSchema.Integer, optional: true, denormalized: true},
  // dataWithDiscardedSuggestions is not actually stored in the database, just passed 
  // through the mutation so that we can provide html that doesn't include private
  // information.
  dataWithDiscardedSuggestions: {type: String, optional: true, nullable: true}
})

export const defaultEditorPlaceholder = isFriendlyUI ?
`Highlight text to format it. Type @ to mention a user, post, or topic.` :
  
`Text goes here! See lesswrong.com/editor for info about everything the editor can do.

lesswrong.com/editor covers formatting, draft-sharing, co-authoring, LaTeX, footnotes, tagging users and posts, spoiler tags, Markdown, tables, crossposting, and more.`;


export const debateEditorPlaceholder = 
`Enter your first dialogue comment here, add other participants as co-authors, then save this as a draft.

Other participants will be able to participate by leaving comments on the draft, which will automatically be converted into dialogue responses.`;

export const linkpostEditorPlaceholder =
`Share an excerpt, a summary, or a note about why you like the post.

You can paste the whole post if you have permission from the author, or add them as co-author in the Options below.
`

export const questionEditorPlaceholder =
`Kick off a discussion or solicit answers to something you’re confused about.`

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
  hintText: defaultEditorPlaceholder,
  pingbacks: false,
  revisionsHaveCommitMessages: false,
}

interface EditableField<N extends CollectionNameString> extends CollectionFieldSpecification<N> {
  editableFieldOptions: EditableFieldOptions;
};

export function isEditableField<N extends CollectionNameString>(field: [string, CollectionFieldSpecification<N>]): field is [string, EditableField<N>] {
  return !!field[1].editableFieldOptions;
}

export const getEditableFieldsByCollection = (() => {
  let editableFieldsByCollection: Partial<Record<CollectionNameString, Record<string, EditableField<CollectionNameString>>>>;
  return () => {
    const { allSchemas }: { allSchemas: Record<string, SchemaType<CollectionNameString>> } = require('../schema/allSchemas');
    if (!editableFieldsByCollection) {
      // const allCollections = getAllCollections();
      editableFieldsByCollection = Object.entries(allSchemas).reduce<Partial<Record<CollectionNameString, Record<string, EditableField<CollectionNameString>>>>>((acc, [collectionName, schema]) => {
        const editableFields = Object.entries(schema).filter(isEditableField);
        if (editableFields.length > 0) {
          acc[collectionName as CollectionNameString] = Object.fromEntries(editableFields);
        }
        return acc;
      }, {});
    }

    return editableFieldsByCollection;
  }
})();

export const getEditableCollectionNames = () => Object.keys(getEditableFieldsByCollection()) as CollectionNameString[];
export const getEditableFieldNamesForCollection = (collectionName: CollectionNameString) => Object.keys(getEditableFieldsByCollection()[collectionName] ?? {});
export const getEditableFieldInCollection = <N extends CollectionNameString>(collectionName: N, fieldName: string) => getEditableFieldsByCollection()[collectionName]?.[fieldName];
export const editableFieldIsNormalized = (collectionName: CollectionNameString, fieldName: string) => !!getEditableFieldInCollection(collectionName, fieldName)?.editableFieldOptions.callbackOptions.normalized;

const buildEditableResolver = <N extends CollectionNameString>(
  collectionName: N,
  fieldName: string,
  normalized: boolean,
): CollectionFieldResolveAs<N> => {
  if (normalized) {
    return {
      type: "Revision",
      arguments: "version: String",
      resolver: async (
        doc: ObjectsByCollectionName[N],
        args: {version?: string},
        context: ResolverContext,
      ): Promise<DbRevision|null> => {
        const {currentUser, Revisions} = context;
        const {checkAccess} = Revisions;

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
      },
      sqlResolver: ({field, resolverArg, join}) => join({
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
      }),
    };
  }

  return {
    type: "Revision",
    arguments: "version: String",
    resolver: async (
      doc: ObjectsByCollectionName[N],
      {version}: {version?: string},
      context: ResolverContext,
    ): Promise<DbRevision|null> => {
      const {currentUser, Revisions} = context;
      if (version) {
        const {checkAccess} = Revisions;
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
        originalContents: getOriginalContents(
          context.currentUser,
          doc,
          docField.originalContents,
        ),
      } as DbRevision;
      // HACK: Pretend that this denormalized field is a DbRevision (even though
      // it's missing an _id and some other fields)
      return result
    },
  };
}


const defaultPingbackFields = {
  // Dictionary from collection name to array of distinct referenced
  // document IDs in that collection, in order of appearance
  pingbacks: {
    type: Object,
    canRead: 'guests',
    optional: true,
    hidden: true,
    denormalized: true,
  },
  "pingbacks.$": {
    type: Array,
  },
  "pingbacks.$.$": {
    type: String,
  },
} as const;

export function editableFields<N extends CollectionNameString>(collectionName: N, options: MakeEditableOptions<N> = {}): Record<string, CollectionFieldSpecification<N>> {  
  const optionsWithDefaults = { ...defaultOptions, ...options };
  const {
    commentEditor,
    commentStyles,
    label,
    formVariant,
    hintText,
    order,
    hideControls = false,
    formGroup,
    permissions,
    fieldName = "contents" as EditableFieldName<N>,
    hidden = false,
    pingbacks = false,
    normalized = false,
    revisionsHaveCommitMessages,
    hasToc,
  } = optionsWithDefaults;

  // We don't want to allow random stuff like escape characters in editable field names, since:
  // 1. why would you do that
  // 2. we manually interpolate editable field names into a SQL string in one place
  if (!/^[a-zA-Z]+$/.test(fieldName)) {
    throw new Error(`Invalid characters in ${fieldName}; only a-z & A-Z are allowed.`);
  }

  const getLocalStorageId = options.getLocalStorageId || ((doc: any, name: string): {id: string, verify: boolean} => {
    const { _id, conversationId } = doc
    if (_id && name) { return {id: `${_id}${name}`, verify: true}}
    else if (_id) { return {id: _id, verify: true }}
    else if (conversationId) { return {id: conversationId, verify: true }}
    else if (name) { return {id: `${collectionName}_new_${name}`, verify: true }}
    else {
      throw Error(`Can't get storage ID for this document: ${doc}`)
    }
  });

  const callbackOptions: EditableFieldCallbackOptions = {
    pingbacks,
    normalized,
  };

  const clientOptions: EditableFieldClientOptions = {
    getLocalStorageId,
    hasToc,
    revisionsHaveCommitMessages
  };

  const editableFieldOptions: EditableFieldOptions = {
    callbackOptions,
    clientOptions,
  };

  const formOptions = {
    label,
    formVariant,
    hintText,
    fieldName,
    collectionName,
    commentEditor,
    commentStyles,
    hideControls,
  };

  const editableField: CollectionFieldSpecification<N> = {
    type: RevisionStorageType,
    editableFieldOptions,
    optional: true,
    logChanges: false, //Logged via Revisions rather than LWEvents
    typescriptType: "EditableFieldContents",
    group: formGroup,
    ...permissions,
    order,
    hidden,
    control: 'EditorFormComponent',
    resolveAs: buildEditableResolver(collectionName, fieldName, normalized),
    form: formOptions,
  };

  const latestRevisionIdFieldName = `${fieldName}_latest`;
  const latestRevisionIdField: CollectionFieldSpecification<N> = {
    type: String,
    canRead: ['guests'],
    optional: true,
  };

  const revisionsResolverFieldName = fieldName === "contents"
    ? "revisions"
    : camelCaseify(`${fieldName}Revisions`);

  const revisionsResolverField: CollectionFieldSpecification<N> = {
    type: Object,
    canRead: ['guests'],
    optional: true,
    resolveAs: {
      type: '[Revision]',
      arguments: 'limit: Int = 5',
      resolver: async (post: ObjectsByCollectionName[N], args: { limit: number }, context: ResolverContext) => {
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

        return await accessFilterMultiple(currentUser, Revisions, loaderResults, context);
      }
    },
  };

  const versionResolverFieldName = fieldName === "contents"
    ? "version"
    : camelCaseify(`${fieldName}Version`);

  const versionResolverField: CollectionFieldSpecification<N> = {
    type: String,
    canRead: ['guests'],
    optional: true,
    resolveAs: {
      type: 'String',
      resolver: (doc: ObjectsByCollectionName[N]): string => {
        return (doc as AnyBecauseTodo)[fieldName]?.version
      }
    },
  };

  const pingbackFields: Partial<typeof defaultPingbackFields> = pingbacks
    ? defaultPingbackFields
    : {};

  return {
    [fieldName]: editableField,
    [latestRevisionIdFieldName]: latestRevisionIdField,
    [revisionsResolverFieldName]: revisionsResolverField,
    [versionResolverFieldName]: versionResolverField,
    ...pingbackFields,
  };
}
