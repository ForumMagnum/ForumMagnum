import { generateIdResolverSingle } from '../../modules/utils/schemaUtils'

/*

A SimpleSchema-compatible JSON schema

*/

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
    foreignKey: "Users",
    viewableBy: ['members'],
    insertableBy: ['members'],
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
  name: {
    type: String,
    viewableBy: ['members'],
    insertableBy: ['members'],
  },
  documentId: {
    type: String,
    // No explicit foreign-key relationship because documentId refers to different collections based on event type
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['members'],
  },
  important: { // marking an event as important means it should never be erased
    type: Boolean,
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['members'],
    editableBy: ['admins']
  },
  properties: {
    type: Object,
    optional: true,
    blackbox: true,
    viewableBy: ['members'],
    insertableBy: ['members'],
  },
  intercom: { // whether to send this event to intercom or not
    type: Boolean,
    optional: true,
    viewableBy: ['members'],
    insertableBy: ['members'],
  }
};

export default schema;
