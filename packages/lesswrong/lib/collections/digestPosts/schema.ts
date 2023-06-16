import { foreignKeyField } from '../../utils/schemaUtils'
import { schemaDefaultValue } from '../../collectionUtils';

const DIGEST_STATUSES = new TupleSet(['yes', 'maybe', 'no'] as const);
export type ReviewSortOption = UnionOf<typeof DIGEST_STATUSES>;

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
