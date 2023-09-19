import { schemaDefaultValue } from '../../collectionUtils';
import { foreignKeyField } from '../../utils/schemaUtils'
import { userOwns } from '../../vulcan-users/permissions';

const commonFields = (nullable: boolean) => ({
  hidden: true,
  canCreate: ['admins' as const],
  canRead: ['guests' as const],
  canUpdate: ['admins' as const],
  optional: nullable,
  nullable,
});

const schema: SchemaType<DbUserMostValuablePost> = {
  _id: {
    type: String,
    ...commonFields(false)
  },
  predictionId: {
    type: String,
    ...commonFields(false)
  },
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
    ...commonFields(false)
  },
  creator: {
    type: ElicitUser, // TODO
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
    type: String,
    ...commonFields(false)
  },
};

export default schema;
