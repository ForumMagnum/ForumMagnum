/*

A SimpleSchema-compatible JSON schema

*/

import Users from 'meteor/vulcan:users';
import Collections from '../collections/collection.js'

//define schema
const schema = {
  _id: {
    optional: true,
    type: String,
    viewableBy: ['guests'],
  },
  createdAt: {
    type: Date,
    optional: true,
    onInsert: (document, currentUser) => {
      return new Date();
    },
    viewableBy: ['members'],
  },
  userId: {
    type: String,
    viewableBy: ['members'],
    insertableBy: ['admins'],
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: (event, args, context) => context.Users.findOne({_id: event.userId}, {fields: context.getViewableFields(context.currentUser, context.Users)}),
      addOriginalField: true,
    },
    optional: true,
  },
  collectionId: {
    type: String,
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['admins'],
    resolveAs: {
      fieldName: 'collection',
      addOriginalField: true,
      type: "Collection",
      resolver: (userCollectionRel, args, context) => {
        if (!userCollectionRel.collectionId) return null;
        return context.Collections.findOne({_id: userCollectionRel.collectionId})
      }
    },
  },
  lastViewedPostSlug: {
    type: String,
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['admins'],
  },
  lastViewedPostTitle: {
    type: String,
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['admins'],
  }
};

export default schema;
