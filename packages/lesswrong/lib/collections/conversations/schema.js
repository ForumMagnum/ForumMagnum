import { generateIdResolverMulti } from '../../modules/utils/schemaUtils'

/*

A SimpleSchema-compatible JSON schema

*/


const schema = {
  _id: {
    optional: true,
    type: String,
    viewableBy: ['members'],
  },
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: ['members'],
    onInsert: (document) => {
      return new Date();
    }
  },
  title: {
    type: String,
    viewableBy: ['members'],
    editableBy: ['members'],
    insertableBy: ['members'],
    optional: true,
    label: "Conversation Title"
  },
  participantIds: {
    type: Array,
    viewableBy: ['members'],
    insertableBy: ['members'],
    editableBy: ['members'],
    optional: true,
    control: "UsersListEditor",
    label: "Participants",
    resolveAs: {
      fieldName: 'participants',
      type: '[User]',
      resolver: generateIdResolverMulti(
        {collectionName: 'Users', fieldName: 'participantIds'}
      ),
      addOriginalField: true
    }
  },

  'participantIds.$': {
    type: String,
    optional: true,
  },
  latestActivity: {
    type: Date,
    viewableBy: ['members'],
    onInsert: (document) => {
      return new Date(); // if this is an insert, set createdAt to current timestamp
    },
    optional: true,
  },
  af: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['admins'],
    optional: true,
  }
};

export default schema;
