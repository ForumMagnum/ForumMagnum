import { foreignKeyField } from '../../utils/schemaUtils'
import { TupleSet, UnionOf } from '../../utils/typeGuardUtils';
import { addUniversalFields } from '../../collectionUtils';

export const DIGEST_STATUSES = new TupleSet(['yes', 'maybe', 'no'] as const)
export type InDigestStatus = UnionOf<typeof DIGEST_STATUSES>

const schema: SchemaType<"DigestPosts"> = {
  ...addUniversalFields({}),
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
    nullable: false
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
    nullable: false,
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
