import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations, schemaDefaultValue } from '../../collectionUtils'
import { forumTypeSetting } from '../../instanceSettings';
import { foreignKeyField } from '../../utils/schemaUtils';

const schema: SchemaType<DbPostComparison> = {
  postIds: {
    type: Array,
    insertableBy: ['members'],
  },
  'postIds.$': {
    type: String,
  },
  rankings: {
    type: Object,
    insertableBy: ['members'],
    blackbox: true,
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    optional: true,
    viewableBy: ['guests'],
  },
};

export const PostComparisons: PostComparisonsCollection = createCollection({
  collectionName: 'PostComparisons',
  typeName: 'PostComparison',
  collectionType: forumTypeSetting.get() === 'EAForum' ? 'pg' : 'mongo',
  schema,
  resolvers: getDefaultResolvers('PostComparisons'),
  mutations: getDefaultMutations('PostComparisons', {
    newCheck: (user: DbUser|null, tag: DbPostComparison|null) => {
      return !!user;
    },
    editCheck: (user: DbUser|null, tag: DbPostComparison|null) => {
      return false;
    },
    removeCheck: (user: DbUser|null, tag: DbPostComparison|null) => {
      return false;
    },
  }),
});

PostComparisons.checkAccess = async (currentUser: DbUser|null, postComparison: DbPostComparison, context: ResolverContext|null): Promise<boolean> => {
  return false;
}

addUniversalFields({collection: PostComparisons})

export default PostComparisons;
