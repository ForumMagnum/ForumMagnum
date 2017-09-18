/*

A SimpleSchema-compatible JSON schema

*/

import Users from 'meteor/vulcan:users';
import GraphQLSchema from 'meteor/vulcan:core';

const schema = {
  _id: {
    type: String,
    viewableBy: Users.owns,
    optional: true,
  },
  userId: {
    type: String,
    viewableBy: ['members'],
    insertableBy: Users.owns,
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: (message, args, context) => {
        return context.Users.findOne({_id: message.userId}, {fields: context.getViewableFields(context.currentUser, context.Users)});
      },
      addOriginalField: true,
    },
    optional: true,
  },
  documentId: {
    type: String,
    optional: true,
    viewableBy: Users.owns,
  },
  documentType: {
    type: String,
    optional: true,
    viewableBy: Users.owns,
  },
  link: {
    type: String,
    optional: true,
    viewableBy: Users.owns,
  },
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: ['members'],
    onInsert: (document, currentUser) => {
      return new Date();
    },
  },v
};

export default schema;
