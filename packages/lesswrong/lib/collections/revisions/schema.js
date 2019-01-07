import { generateIdResolverSingle } from '../../modules/utils/schemaUtils'
/*

A SimpleSchema-compatible JSON schema

*/

const schema = {
  _id: {
    type: String,
    viewableBy: ['guests'],
  },
  createdAt: {
    type: Date,
    viewableBy: ['guests'],
    onCreate: () => new Date(),
  },
  userId: {
    viewableBy: ['guests'],
    type: String,
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: generateIdResolverSingle(
        {collectionName: 'Users', fieldName: 'userId'}
      ),
      addOriginalField: true
    },
  },
  canonicalContentType: {
    type: String,
    viewableBy: ['guests'],
  },
  canonicalContent: {
    type: Object,
    viewableBy: ['guests'],
    blackbox: true, 
  },
  html: {
    type: String,
    viewableBy: ['guests'],
  },
  markdown: {
    type: String,
    viewableBy: ['guests'],
    resolveAs: {
      type: 'String',
      resolver: () => {
        return "markdown resolver"
      }
    }
  },
  draftJs: {
    type: String,
    viewableBy: ['guests'],
    resolveAs: {
      type: 'JSON',
      resolver: () => {
        return "draftJS resolver"
      }
    }
  },
};

export default schema;
