import { documentIsNotDeleted, userOwns } from '../vulcan-users/permissions';
import { camelCaseify } from '../vulcan-lib/utils';
import { ContentType, getOriginalContents } from '../collections/revisions/schema'
import { accessFilterMultiple, addFieldsDict } from '../utils/schemaUtils';
import SimpleSchema from 'simpl-schema'
import { getWithLoader } from '../loaders';
import { isFriendlyUI } from '../../themes/forumTheme';
import { EditableFieldName, MakeEditableOptions, editableCollectionsFieldOptions } from './makeEditableOptions';

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

export const editableCollections = new Set<CollectionNameString>()
export const editableCollectionsFields: Record<CollectionNameString,Array<string>> = {} as any;
let editableFieldsSealed = false;
export function sealEditableFields() { editableFieldsSealed=true }

const buildEditableResolver = <N extends CollectionNameString>(
  collection: CollectionBase<N>,
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
        collectionName: collection.collectionName,
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

export const makeEditable = <N extends CollectionNameString>({
  collection,
  options = {},
}: {
  collection: CollectionBase<N>,
  options: MakeEditableOptions<N>,
}) => {
  if (editableFieldsSealed)
    throw new Error("Called makeEditable after addAllEditableCallbacks already ran; this indicates a problem with import order");
  
  options = {...defaultOptions, ...options}
  const {
    commentEditor,
    commentStyles,
    formGroup,
    permissions,
    fieldName = "contents" as EditableFieldName<N>,
    label,
    formVariant,
    hintText,
    order,
    hidden = false,
    hideControls = false,
    pingbacks = false,
    normalized = false,
    //revisionsHaveCommitMessages, //unused in this function (but used elsewhere)
  } = options

  // We don't want to allow random stuff like escape characters in editable field names, since:
  // 1. why would you do that
  // 2. we manually interpolate editable field names into a SQL string in one place
  if (!/^[a-zA-Z]+$/.test(fieldName)) {
    throw new Error(`Invalid characters in ${fieldName}; only a-z & A-Z are allowed.`);
  }

  const collectionName = collection.collectionName;
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
  
  editableCollections.add(collectionName)
  editableCollectionsFields[collectionName] = [
    ...(editableCollectionsFields[collectionName] || []),
    fieldName
  ]
  editableCollectionsFieldOptions[collectionName] = {
    ...editableCollectionsFieldOptions[collectionName],
    [fieldName]: {
      ...options,
      fieldName,
      getLocalStorageId
    },
  };

  addFieldsDict(collection, {
    [fieldName]: {
      type: RevisionStorageType,
      optional: true,
      logChanges: false, //Logged via Revisions rather than LWEvents
      typescriptType: "EditableFieldContents",
      group: formGroup,
      ...permissions,
      order,
      hidden,
      control: 'EditorFormComponent',
      resolveAs: buildEditableResolver(collection, fieldName, normalized),
      form: {
        label,
        formVariant,
        hintText,
        fieldName,
        collectionName,
        commentEditor,
        commentStyles,
        hideControls,
      },
    },

    [`${fieldName}_latest`]: {
      type: String,
      canRead: ['guests'],
      optional: true,
    },

    [fieldName === "contents" ? "revisions" : camelCaseify(`${fieldName}Revisions`)]: {
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
      }
    },
    
    [fieldName === "contents" ? "version" : camelCaseify(`${fieldName}Version`)]: {
      type: String,
      canRead: ['guests'],
      optional: true,
      resolveAs: {
        type: 'String',
        resolver: (post: ObjectsByCollectionName[N]): string => {
          return (post as AnyBecauseTodo)[fieldName]?.version
        }
      }
    }
  });
  
  if (pingbacks) {
    addFieldsDict(collection, {
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
    });
  }
}
