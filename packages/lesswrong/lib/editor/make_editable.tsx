import React from 'react';
import { userOwns } from '../vulcan-users/permissions';
import { camelCaseify } from '../vulcan-lib/utils';
import { ContentType } from '../collections/revisions/schema'
import { accessFilterMultiple, addFieldsDict } from '../utils/schemaUtils';
import SimpleSchema from 'simpl-schema'

export const RevisionStorageType = new SimpleSchema({
  originalContents: {type: ContentType, optional: true},
  userId: {type: String, optional: true},
  commitMessage: {type: String, optional: true},
  html: {type: String, optional: true, denormalized: true},
  updateType: {type: String, optional: true, allowedValues: ['initial', 'patch', 'minor', 'major']},
  version: {type: String, optional: true},
  editedAt: {type: Date, optional: true},
  wordCount: {type: SimpleSchema.Integer, optional: true, denormalized: true}
})

export interface MakeEditableOptions {
  commentEditor?: boolean,
  commentStyles?: boolean,
  commentLocalStorage?: boolean,
  getLocalStorageId?: null | ((doc: any, name: string) => {id: string, verify: boolean}),
  formGroup?: any,
  permissions?: {
    viewableBy?: any,
    editableBy?: any,
    insertableBy?: any,
  },
  fieldName?: string,
  label?: string,
  order?: number,
  hideControls?: boolean,
  hintText?: any,
  pingbacks?: boolean,
  revisionsHaveCommitMessages?: boolean,
  hidden?: boolean,
}

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
    viewableBy: ['guests'],
    editableBy: [userOwns, 'sunshineRegiment', 'admins'],
    insertableBy: ['members']
  },
  fieldName: "",
  order: 0,
  hintText: (
    <div>
      <div>Write here. Select text for formatting options.</div>
      <div>We support LaTeX: Cmd-4 for inline, Cmd-M for block-level (Ctrl on Windows).</div>
      <div>You can switch between rich text and markdown in your user settings.</div>
    </div>
  ),
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
        resolver: async (doc: T, args: {version: string}, context: ResolverContext): Promise<DbRevision|null> => {
          const { version } = args;
          const { currentUser, Revisions } = context;
          const field = fieldName || "contents"
          const { checkAccess } = Revisions
          if (version) {
            const revision = await Revisions.findOne({documentId: doc._id, version, fieldName: field})
            if (!revision) return null;
            return await checkAccess(currentUser, revision, context) ? revision : null
          }
          const docField = doc[field];
          if (!docField) return null
          return {
            _id: `${doc._id}_${fieldName}`, //HACK
            editedAt: (docField?.editedAt) || new Date(),
            userId: docField?.userId,
            commitMessage: docField?.commitMessage,
            originalContents: (docField?.originalContents) || {},
            html: docField?.html,
            updateType: docField?.updateType,
            version: docField?.version,
            wordCount: docField?.wordCount,
          } as DbRevision;
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
    
    [camelCaseify(`${fieldName}Revisions`)]: {
      type: Object,
      viewableBy: ['guests'],
      optional: true,
      resolveAs: {
        type: '[Revision]',
        arguments: 'limit: Int = 5',
        resolver: async (post: T, args: { limit: number }, context: ResolverContext): Promise<Array<DbRevision>> => {
          const { limit } = args;
          const { currentUser, Revisions } = context;
          const field = fieldName || "contents"
          const resolvedDocs = await Revisions.find({documentId: post._id, fieldName: field}, {sort: {editedAt: -1}, limit}).fetch()
          return await accessFilterMultiple(currentUser, Revisions, resolvedDocs, context);
        }
      }
    },
    
    [camelCaseify(`${fieldName}Version`)]: {
      type: String,
      viewableBy: ['guests'],
      optional: true,
      resolveAs: {
        type: 'String',
        resolver: (post: T): string => {
          return post[fieldName || "contents"]?.version
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
        viewableBy: 'guests',
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
