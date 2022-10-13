import { ensureIndex, getDefaultMutations, getDefaultResolvers, schemaDefaultValue } from "../../collectionUtils";
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
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
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
  subforumShowUnreadInSidebar: {
    type: Boolean,
    nullable: false,
    ...schemaDefaultValue(false),
  },
  subforumEmailNotifications: {
    type: Boolean,
    nullable: false,
    ...schemaDefaultValue(false),
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

ensureIndex(UserTagRels, {tagId:1, userId:1}, {unique: true});

export default UserTagRels;
