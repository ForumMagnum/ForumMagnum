import { addUniversalFields } from '../../collectionUtils';

const commonFields = (nullable: boolean) => ({
  hidden: true,
  canCreate: ['admins' as const],
  canRead: ['admins' as const],
  canUpdate: ['admins' as const],
  optional: nullable,
  nullable,
});

const schema: SchemaType<'CurationEmails'> = {
  ...addUniversalFields({}),
  userId: {
    type: String,
    ...commonFields(false)
  },
  postId: {
    type: String,
    ...commonFields(false)
  },
};

export default schema;
