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
  _id: { type: String },
  displayName: { type: String },
  isQuestionCreator: { type: Boolean },
  sourceUserId: { type: String, nullable: true, optional: true }
});

const schema: SchemaType<"ElicitQuestionPredictions"> = {
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
    onInsert: (prediction) => prediction.createdAt ?? new Date(),
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
  userId: {
    ...foreignKeyField({
      type: 'User',
      collectionName: 'Users',
      idFieldName: 'userId',
      resolverName: 'user',
      nullable: true
    }),
    ...commonFields(true)
  },
  sourceUrl: {
    type: String,
    ...commonFields(true)
  },
  sourceId: {
    type: String,
    ...commonFields(true)
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
