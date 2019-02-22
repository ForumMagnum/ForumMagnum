import React from 'react'
import { Components } from 'meteor/vulcan:core'
import { generateIdResolverMulti } from '../../modules/utils/schemaUtils'

const schema = {

  // default properties

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

  postedAt: {
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
    editableBy: ['members'],
    insertableBy: ['members'],
  },

  subtitle: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
  },

  collectionId: {
    type: String,
    foreignKey: "Collections",
    optional: false,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['members'],
  },

  number: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  //TODO: Make resolvers more efficient by running `find` query instead of `findOne` query

  postIds: {
    type: Array,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
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

  'postIds.$': {
    type: String,
    foreignKey: "Posts",
    optional: true,
  },

  sequenceIds: {
    type: Array,
    optional: true,
    viewableBy: ["guests"],
    editableBy: ['members'],
    insertableBy: ['members'],
    resolveAs: {
      fieldName: 'sequences',
      type: '[Sequence]',
      resolver: generateIdResolverMulti(
        {collectionName: 'Sequences', fieldName: 'sequenceIds'}
      ),
      addOriginalField: true,
    },
    control: 'SequencesListEditor',
  },

  'sequenceIds.$': {
    type: String,
    foreignKey: "Sequences",
    optional: true,
  }

}


export default schema;
