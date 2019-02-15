import { generateIdResolverSingle } from '../../modules/utils/schemaUtils'
/*

A SimpleSchema-compatible JSON schema

*/

import Users from 'meteor/vulcan:users';

const schema = {
  _id: {
    type: String,
    viewableBy: ['guests'],
    optional: true,
  },
  userId: {
    type: String,
    foreignKey: "Users",
    viewableBy: ['members'],
    insertableBy: Users.owns,
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: generateIdResolverSingle(
        {collectionName: 'Users', fieldName: 'userId'}
      ),
      addOriginalField: true,
    },
    optional: true,
  },
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: ['members'],
    onInsert: (document, currentUser) => {
      return new Date();
    },
  },
  conversationId: {
    type: String,
    foreignKey: "Conversations",
    viewableBy: ['members'],
    insertableBy: ['members'],
    hidden: true,
    resolveAs: {
      fieldName: 'conversation',
      type: 'Conversation',
      resolver: generateIdResolverSingle(
        {collectionName: 'Conversations', fieldName: 'conversationId'}
      ),
      addOriginalField: true,
    },
  }
};

export default schema;
