import React from 'react';
import { Components } from 'meteor/vulcan:core';
import { generateIdResolverSingle, generateIdResolverMulti } from '../../modules/utils/schemaUtils'

const schema = {

  _id: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
  },

  createdAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    onInsert: () => {
      return new Date();
    },
  },

  // Custom Properties

  title: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ["admins"],
    insertableBy: ['admins'],
    placeholder:"Title",
    order: 10,
  },

  subtitle: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ["admins"],
    insertableBy: ['admins'],
    placeholder:"Subtitle",
    order: 20
  },

  // description: {
  //   type: Object,
  //   blackbox: true,
  //   optional: true,
  //   viewableBy: ['guests'],
  //   editableBy: ["admins"],
  //   insertableBy: ['admins'],
  //   control: 'EditorFormComponent',
  // },

  // plaintextDescription: {
  //   type: String,
  //   optional: true,
  //   viewableBy: ['guests'],
  // },

  // htmlDescription: {
  //   type: String,
  //   optional: true,
  //   viewableBy: ['guests'],
  // },

  number: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  sequenceId: {
    type: String,
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['members'],
    resolveAs: {
      fieldName: 'sequence',
      type: 'Sequence',
      resolver: generateIdResolverSingle(
        {collectionName: 'Sequences', fieldName: 'sequenceId'}
      ),
      addOriginalField: true,
    }
  },

  postIds: {
    type: Array,
    optional: false,
    viewableBy: ["guests"],
    editableBy: ["members"],
    insertableBy: ['members'],
    resolveAs: {
      fieldName: 'posts',
      type: '[Post]',
      resolver: generateIdResolverMulti(
        {collectionName: 'Posts', fieldName: 'postIds'}
      ),
      addOriginalField: true,
    },
    control: 'PostsListEditor',
  },

  "postIds.$": {
    type: String,
    optional: true,
  },
}

export default schema;
