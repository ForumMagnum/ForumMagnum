import { generateIdResolverSingle } from '../../modules/utils/schemaUtils'
import SimpleSchema from 'simpl-schema'
// import Revisions from './collection'

export const ContentType = new SimpleSchema({
  type: String,
  data: SimpleSchema.oneOf(
    String, 
    {
      type: Object, 
      blackbox: true
    }
  )
})

SimpleSchema.extendOptions([ 'inputType' ]);
/*

A SimpleSchema-compatible JSON schema

*/

const schema = {
  _id: {
    type: String,
    viewableBy: ['guests'],
  },
  documentId: {
    type: String,
  },
  fieldName: {
    type: String,
  },
  editedAt: {
    type: Date,
    optional: true, 
    viewableBy: ['guests'],
  },
  updateType: {
    viewableBy: ['guests'],
    editableBy: ['members'],
    type: String,
    allowedValues: ['initial', 'patch', 'minor', 'major'],
    optional: true
  },
  version: {
    type: String,
    optional: true,
    viewableBy: ['guests']
  },
  userId: {
    viewableBy: ['guests'],
    type: String,
    optional: true,
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: generateIdResolverSingle(
        {collectionName: 'Users', fieldName: 'userId'}
      ),
      addOriginalField: true
    },
  },
  originalContents: {
    type: ContentType,
    viewableBy: ['guests'],
    editableBy: ['members']
  },
  html: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
  },
  markdown: {
    type: String,
    viewableBy: ['guests'],
    // resolveAs defined in resolvers.js
  },
  draftJS: {
    type: Object,
    viewableBy: ['guests'],
    // resolveAs defined in resolvers.js
  },
  wordCount: {
    type: Number,
    viewableBy: ['guests'],
    // resolveAs defined in resolvers.js
  },
  htmlHighlight: {
    type: String, 
    viewableBy: ['guests'],
    // resolveAs defined in resolvers.js
  },
  plaintextDescription: {
    type: String, 
    viewableBy: ['guests'],
    // resolveAs defined in resolvers.js
  }
};

export default schema;
