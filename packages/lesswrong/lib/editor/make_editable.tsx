import { documentIsNotDeleted, userOwns } from '../vulcan-users/permissions';
import { camelCaseify } from '../vulcan-lib/utils';
import { ContentType, getOriginalContents } from '../collections/revisions/schema'
import { accessFilterMultiple, addFieldsDict } from '../utils/schemaUtils';
import SimpleSchema from 'simpl-schema'
import { getWithLoader } from '../loaders';
import { isFriendlyUI } from '../../themes/forumTheme';

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

export interface MakeEditableOptions {
  commentEditor?: boolean,
  commentStyles?: boolean,
  commentLocalStorage?: boolean,
  getLocalStorageId?: null | ((doc: any, name: string) => {id: string, verify: boolean}),
  formGroup?: any,
  permissions?: {
    canRead?: any,
    canUpdate?: any,
    canCreate?: any,
  },
  fieldName?: string,
  label?: string,
  order?: number,
  hideControls?: boolean,
  hintText?: string,
  pingbacks?: boolean,
  revisionsHaveCommitMessages?: boolean,
  hidden?: boolean,
  hasToc?: boolean,
}

export const defaultEditorPlaceholder = isFriendlyUI ?
`Highlight text to format it. Type # to reference a post, @ to mention someone.` :  
  
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

const defaultOptions: MakeEditableOptions = {
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
  fieldName: "",
  order: 0,
  hintText: defaultEditorPlaceholder,
  pingbacks: false,
  revisionsHaveCommitMessages: false,
}

export const editableCollections = new Set<CollectionNameString>()
export const editableCollectionsFields: Record<CollectionNameString,Array<string>> = {} as any;
export const editableCollectionsFieldOptions: Record<CollectionNameString,Record<string,MakeEditableOptions>> = {} as any;
let editableFieldsSealed = false;
export function sealEditableFields() { editableFieldsSealed=true }

export const makeEditable = <T extends DbObject>({collection, options = {}}: {
  collection: CollectionBase<T>,
  options: MakeEditableOptions,
}) => {
  if (editableFieldsSealed)
    throw new Error("Called makeEditable after addAllEditableCallbacks already ran; this indicates a problem with import order");
  
  options = {...defaultOptions, ...options}
  const {
    commentEditor,
    commentStyles,
    formGroup,
    permissions,
    fieldName,
    label,
    hintText,
    order,
    hidden = false,
    hideControls = false,
    pingbacks = false
    //revisionsHaveCommitMessages, //unused in this function (but used elsewhere)
  } = options

  const collectionName = collection.options.collectionName;
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
    fieldName || "contents"
  ]
  editableCollectionsFieldOptions[collectionName] = {
    ...editableCollectionsFieldOptions[collectionName],
    [fieldName || "contents"]: {
      ...options,
      fieldName: fieldName||"contents",
      getLocalStorageId
    },
  };

  addFieldsDict(collection, {
    [fieldName || "contents"]: {
      type: RevisionStorageType,
      optional: true,
      logChanges: false, //Logged via Revisions rather than LWEvents
      typescriptType: "EditableFieldContents",
      group: formGroup,
      ...permissions,
      order,
      hidden,
      control: 'EditorFormComponent',
      resolveAs: {
        type: 'Revision',
        arguments: 'version: String',
        resolver: async (doc: T, args: {version?: string}, context: ResolverContext): Promise<DbRevision|null> => {
          const { version } = args;
          const { currentUser, Revisions } = context;
          const field = fieldName || "contents"
          const { checkAccess } = Revisions
          if (version) {
            if (version === "draft") {
              // If version is the special string "draft", that means
              // instead of returning the latest non-draft version
              // (what we'd normally do), we instead return the latest
              // version period, including draft versions.
              const revision = await Revisions.findOne({documentId: doc._id, fieldName: field}, {sort: {editedAt: -1}})

              if (!revision) return null;
              return await checkAccess(currentUser, revision, context) ? revision : null
            } else {
              const revision = await Revisions.findOne({documentId: doc._id, version, fieldName: field})
              if (!revision) return null;
              return await checkAccess(currentUser, revision, context) ? revision : null
            }
          }
          const docField = (doc as AnyBecauseTodo)[field];
          if (!docField) return null

          const result: DbRevision = {
            ...docField,
            // we're specifying these fields manually because docField doesn't have them, 
            // or because we need to control the permissions on them.
            //
            // The reason we need to return documentId and collectionName is because this 
            // entire result gets recursively resolved by revision field resolvers, and those
            // resolvers depend on these fields existing.
            _id: `${doc._id}_${fieldName}`, //HACK
            documentId: doc._id,
            collectionName: collection.collectionName,
            editedAt: new Date(docField?.editedAt ?? Date.now()),
            originalContents: getOriginalContents(context.currentUser, doc, docField.originalContents),
          }
          return result
          //HACK: Pretend that this denormalized field is a DbRevision (even though it's missing an _id and some other fields)
        }
      },
      form: {
        label,
        hintText: hintText,
        fieldName: fieldName || "contents",
        collectionName,
        commentEditor,
        commentStyles,
        hideControls,
      },
    },

    [`${fieldName || "contents"}_latest`]: {
      type: String,
      canRead: ['guests'],
      optional: true,
    },

    [camelCaseify(`${fieldName}Revisions`)]: {
      type: Object,
      canRead: ['guests'],
      optional: true,
      resolveAs: {
        type: '[Revision]',
        arguments: 'limit: Int = 5',
        resolver: async (post: T, args: { limit: number }, context: ResolverContext): Promise<Array<DbRevision>> => {
          const { limit } = args;
          const { currentUser, Revisions } = context;
          const field = fieldName || "contents"
          
          // getWithLoader is used here to fix a performance bug for a particularly nasty bot which resolves `revisions` for thousands of comments.
          // Previously, this would cause a query for every comment whereas now it only causes one (admittedly quite slow) query
          const loaderResults = await getWithLoader(context, Revisions, `revisionsByDocumentId_${field}_${limit}`, { fieldName: field }, "documentId", post._id, { sort: {editedAt: -1}, limit });

          return await accessFilterMultiple(currentUser, Revisions, loaderResults, context);
        }
      }
    },
    
    [camelCaseify(`${fieldName}Version`)]: {
      type: String,
      canRead: ['guests'],
      optional: true,
      resolveAs: {
        type: 'String',
        resolver: (post: T): string => {
          return (post as AnyBecauseTodo)[fieldName || "contents"]?.version
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
