import React from 'react';
import Users from 'meteor/vulcan:users'
import { Utils } from 'meteor/vulcan:core'
import { ContentType } from '../collections/revisions/schema'
import { accessFilterMultiple, addFieldsDict, resolverOnlyField } from '../modules/utils/schemaUtils.js';
import SimpleSchema from 'simpl-schema'

const RevisionStorageType = new SimpleSchema({
  originalContents: {type: ContentType, optional: true},
  userId: {type: String, optional: true},
  html: {type: String, optional: true, denormalized: true},
  updateType: {type: String, optional: true, allowedValues: ['initial', 'patch', 'minor', 'major']},
  version: {type: String, optional: true},
  editedAt: {type: Date, optional: true},
  wordCount: {type: SimpleSchema.Integer, optional: true, denormalized: true}
})

SimpleSchema.extendOptions([ 'inputType' ]);

const defaultOptions = {
  // Determines whether to use the comment editor configuration (e.g. Toolbars)
  commentEditor: false,
  // Determines whether to use the comment editor styles (e.g. Fonts)
  commentStyles: false,
  permissions: {
    viewableBy: ['guests'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
    insertableBy: ['members']
  },
  fieldName: "",
  order: 0,
  enableMarkDownEditor: true
}

export const editableCollections = new Set()
export const editableCollectionsFields = {}

export const makeEditable = ({collection, options = {}}) => {
  options = {...defaultOptions, ...options}
  const {
    commentEditor,
    commentStyles,
    getLocalStorageId,
    formGroup,
    permissions,
    fieldName = "",
    hintText = <div>
      <div>
        Write here. Select text for formatting options.
      </div>
      <div>
        We support LaTeX: Cmd-4 for inline, Cmd-M for block-level (Ctrl on Windows).
      </div>
      <div>
        You can switch between rich text and markdown in your user settings.
      </div>
  </div>,
    order,
    enableMarkDownEditor
  } = options

  editableCollections.add(collection.options.collectionName)
  editableCollectionsFields[collection.options.collectionName] = [
    ...(editableCollectionsFields[collection.options.collectionName] || []), 
    fieldName || "contents"
  ]

  addFieldsDict(collection, {
    [fieldName || "contents"]: resolverOnlyField({
      type: RevisionStorageType,
      inputType: 'UpdateRevisionDataInput',
      optional: true,
      viewableBy: ['guests'],
      editableBy: ['members'],
      insertableBy: ['members'],
      group: formGroup,
      ...permissions,
      order,
      control: 'EditorFormComponent',
      
      graphQLtype: 'Revision',
      graphqlArguments: 'version: String',
      resolver: async (doc, { version }, { currentUser, Revisions }) => {
        const field = fieldName || "contents"
        const { checkAccess } = Revisions
        let revision;
        if (version) {
          revision = await Revisions.findOne({documentId: doc._id, version, fieldName: field})
        } else {
          const revisionID = doc[`${field}_latest`];
          if (!revisionID) return null;
          revision = await Revisions.loader.load(revisionID);
        }
        revision = checkAccess(currentUser, revision) ? revision : null
        
        if (!revision)
          return null;
        
        return {
          editedAt: revision.editedAt || new Date(),
          userId: revision.userId,
          originalContentsType: revision.originalContentsType || "html",
          originalContents: revision.originalContents || {},
          html: revision.html,
          updateType: revision.updateType,
          version: revision.version,
          wordCount: revision.wordCount,
        };
      },
      
      form: {
        hintText:hintText,
        multiLine:true,
        fullWidth:true,
        disableUnderline:true,
        fieldName: fieldName || "contents",
        commentEditor,
        commentStyles,
        getLocalStorageId,
        enableMarkDownEditor,
      },
    }),
    
    [`${fieldName || "contents"}_latest`]: {
      type: String,
      viewableBy: ['guests'],
      hidden: true,
      optional: true,
      ...permissions,
    },
    
    [Utils.camelCaseify(`${fieldName}Revisions`)]: resolverOnlyField({
      type: Object,
      graphQLtype: '[Revision]',
      viewableBy: ['guests'],
      graphqlArguments: 'limit: Int = 5',
      
      resolver: async (post, { limit }, { currentUser, Revisions }) => {
        const field = fieldName || "contents"
        const resolvedDocs = await Revisions.find({documentId: post._id, fieldName: field}, {sort: {editedAt: -1}, limit}).fetch()
        return accessFilterMultiple(currentUser, Revisions, resolvedDocs);
      }
    }),
    
    [Utils.camelCaseify(`${fieldName}Version`)]: resolverOnlyField({
      type: String,
      viewableBy: ['guests'],
      
      resolver: async (doc, args, { currentUser, Revisions }) => {
        const revisionID = doc[`${fieldName || "contents"}_latest`];
        if (!revisionID) return null;
        let revision = await Revisions.loader.load(revisionID);
        revision = Revisions.checkAccess(currentUser, revision) ? revision : null
        return revision?.version;
      }
    })
  });
}
