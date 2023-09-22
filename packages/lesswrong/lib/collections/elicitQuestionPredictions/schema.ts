import SimpleSchema from 'simpl-schema';
import { foreignKeyField, resolverOnlyField } from '../../utils/schemaUtils';

const commonFields = (nullable: boolean) => ({
  hidden: true,
  canCreate: ['admins' as const],
  canRead: ['guests' as const],
  canUpdate: ['admins' as const],
  optional: nullable,
  nullable,
});

const creatorSchema = new SimpleSchema({
  id: { type: String },
  displayName: { type: String },
  isQuestionCreator: { type: Boolean },
  sourceUserId: { type: String }
});

const schema: SchemaType<DbElicitQuestionPrediction> = {
  _id: {
    type: String,
    ...commonFields(false)
  },
  predictionId: resolverOnlyField({
    type: String,
    resolver: ({ _id }) => _id,
  }),
  prediction: {
    type: Number,
    ...commonFields(false)
  },
  createdAt: {
    type: Date,
    ...commonFields(false)
  },
  notes: {
    type: String,
    ...commonFields(true)
  },
  creator: {
    type: creatorSchema,
    ...commonFields(false)
  },
  sourceUrl: {
    type: String,
    ...commonFields(false)
  },
  sourceId: {
    type: String,
    ...commonFields(false)
  },
  binaryQuestionId: {
    ...foreignKeyField({
      type: 'ElicitQuestion',
      collectionName: 'ElicitQuestions',
      idFieldName: 'binaryQuestionId',
      resolverName: 'question',
      nullable: false
    }),
    ...commonFields(false)
  },
};

export default schema;
