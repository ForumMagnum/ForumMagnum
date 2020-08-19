import { foreignKeyField, SchemaType } from '../../utils/schemaUtils'
import SimpleSchema from 'simpl-schema'

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

const schema: SchemaType<DbRevision> = {
  documentId: {
    type: String,
    viewableBy: ['guests'],
  },
  collectionName: {
    type: String,
    viewableBy: ['guests'],
  },
  fieldName: {
    type: String,
    viewableBy: ['guests'],
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
  commitMessage: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members']
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    viewableBy: ['guests'],
    optional: true,
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
  ckEditorMarkup: {
    type: String,
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
  },
  plaintextMainText: {
    type: String,
    viewableBy: ['guests']
    // resolveAs defined in resolvers.js
  },
  changeMetrics: {
    type: Object,
    blackbox: true,
    viewableBy: ['guests']
    // resolveAs defined in resolvers.js
  },
};

export default schema;
