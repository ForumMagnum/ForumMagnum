import { foreignKeyField } from '../../utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils';

export const DIGEST_STATUSES = ['yes', 'maybe', 'no'] as const
export type InDigestStatuses = typeof DIGEST_STATUSES
export type InDigestStatus = InDigestStatuses[number]

const schema: SchemaType<DbDigestPost> = {
  digestId: {
    ...foreignKeyField({
      idFieldName: "digestId",
      resolverName: "digest",
      collectionName: "Digests",
      type: "Digest",
      nullable: false,
    }),
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    hidden: true,
  },
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: false,
    }),
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    hidden: true,
  },
  // is this post in the email digest?
  emailDigestStatus: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },
  // is this post in the on-site digest?
  onsiteDigestStatus: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  }
};

export default schema;
