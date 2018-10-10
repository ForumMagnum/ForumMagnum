/*

A SimpleSchema-compatible JSON schema

*/

import Users from 'meteor/vulcan:users';

//define schema
const schema = {
  _id: {
    optional: true,
    type: String,
    viewableBy: Users.owns,
  },
  userId: {
    type: String,
    optional: true,
    viewableBy: Users.owns,
  },
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: Users.owns,
    onInsert: (document, currentUser) => {
      return new Date();
    }
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
  title: {
    type: String,
    optional: true,
    viewableBy: Users.owns,
  },
  message: {
    type: String,
    optional: true,
    viewableBy: Users.owns,
  },
  type: {
    type: String,
    optional: true,
    viewableBy: Users.owns,
  },
  viewed: {
    type: Boolean,
    optional: true,
    defaultValue: false,
    viewableBy: ['members'],
    insertableBy: ['members'],
    editableBy: ['members'],
  },
};

export default schema;
