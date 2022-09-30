import { getDefaultMutations, getDefaultResolvers, schemaDefaultValue } from "../../collectionUtils";
import { foreignKeyField } from "../../utils/schemaUtils";
import { createCollection } from '../../vulcan-lib';

const schema: SchemaType<DbUserTagRel> = {
  tagId: {
    ...foreignKeyField({
      idFieldName: "tagId",
      resolverName: "tag",
      collectionName: "Tags",
      type: "Tag",
    }),
    canRead: ['guests'],
    canCreate: ['members'],
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
    }),
    canRead: ['guests'],
    canCreate: ['members'],
  },
  subforumLastVisitedAt: {
    type: Date,
    optional: true,
    nullable: true,
    hidden: true
  },
};

export const UserTagRels: UserTagRelsCollection = createCollection({
  collectionName: 'UserTagRels',
  typeName: 'UserTagRel',
  schema,
  // We don't need graphql access currently, but when we do you'll want to add these back in:
  // resolvers: getDefaultResolvers('UserTagRels'),
  // mutations: getDefaultMutations('UserTagRels', {
  //   newCheck: (user: DbUser|null, tag: DbUserTagRel|null) => {
  //     return userCanUseTags(user);
  //   },
  //   editCheck: (user: DbUser|null, tag: DbUserTagRel|null) => {
  //     return userCanUseTags(user);
  //   },
  //   removeCheck: (user: DbUser|null, tag: DbUserTagRel|null) => {
  //     return false;
  //   },
  // }),
});

UserTagRels.checkAccess = async (currentUser: DbUser|null, tagRel: DbUserTagRel, context: ResolverContext|null): Promise<boolean> => {
  // Currently we don't need to access this via graphql so access is disabled
  return false;
}

export default UserTagRels;
