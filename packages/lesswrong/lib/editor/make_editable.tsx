import React from 'react';
import Users from '../collections/users/collection'
import { Utils } from '../vulcan-lib';
import { ContentType } from '../collections/revisions/schema'
import { accessFilterMultiple, addFieldsDict } from '../utils/schemaUtils';
import { editableCollections, editableCollectionsFields, editableCollectionsFieldOptions } from './editableFields';
import SimpleSchema from 'simpl-schema'
export { editableCollections, editableCollectionsFields, editableCollectionsFieldOptions }

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

SimpleSchema.extendOptions([ 'inputType' ]);

const defaultOptions = {
  // Determines whether to use the comment editor configuration (e.g. Toolbars)
  commentEditor: false,
  // Determines whether to use the comment editor styles (e.g. Fonts)
  commentStyles: false,
  // Determines whether to use the comment local storage restoration system
  commentLocalStorage: false,
  permissions: {
    viewableBy: ['guests'],
    editableBy: [Users.owns, 'sunshineRegiment', 'admins'],
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

export const makeEditable = <T extends DbObject>({collection, options = {}}: {
  collection: CollectionBase<T>,
  options: any,
}) => {
  options = {...defaultOptions, ...options}
  const {
    commentEditor,
    commentStyles,
    getLocalStorageId,
    formGroup,
    permissions,
    fieldName,
    hintText,
    order,
    pingbacks = false,
    //revisionsHaveCommitMessages, //unused in this function (but used elsewhere)
  } = options

  const collectionName = collection.options.collectionName;
  editableCollections.add(collectionName)
  editableCollectionsFields[collectionName] = [
    ...(editableCollectionsFields[collectionName] || []),
    fieldName || "contents"
  ]
  editableCollectionsFieldOptions[collectionName] = {
    ...editableCollectionsFieldOptions[collectionName],
    [fieldName || "contents"]: options,
  };

  addFieldsDict(collection, {
    [fieldName || "contents"]: {
      type: RevisionStorageType,
      inputType: 'UpdateRevisionDataInput',
      optional: true,
      group: formGroup,
      ...permissions,
      order,
      control: 'EditorFormComponent',
      form: {
        hintText: hintText,
        fieldName: fieldName || "contents",
        collectionName,
        commentEditor,
        commentStyles,
        getLocalStorageId,
      },
    },

    [fieldName ? `${fieldName}_latest` : "contents_latest"]: {
      type: String,
      viewableBy: ['guests'],
      optional: true,
    },
    
    [Utils.camelCaseify(`${fieldName}Revisions`)]: {
      type: Object,
      viewableBy: ['guests'],
      optional: true,
    },
    
    [Utils.camelCaseify(`${fieldName}Version`)]: {
      type: String,
      viewableBy: ['guests'],
      optional: true,
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
