import { userCanUseTags } from "../../betas";
import { addUniversalFields, ensureIndex, getDefaultMutations, getDefaultResolvers, schemaDefaultValue } from "../../collectionUtils";
import { foreignKeyField } from "../../utils/schemaUtils";
import { createCollection } from '../../vulcan-lib';
import { userIsAdmin, userOwns } from "../../vulcan-users";

const schema: SchemaType<DbUserTagRel> = {
  tagId: {
    ...foreignKeyField({
      idFieldName: "tagId",
      resolverName: "tag",
      collectionName: "Tags",
      type: "Tag",
    }),
    canRead: ['guests'],
    canCreate: [],
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    canRead: ['guests'],
    canCreate: [],
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
    optional: false,
    label: "Unread count in sidebar",
    canRead: [userOwns, 'admins'],
    canCreate: ['members', 'admins'],
    canUpdate: [userOwns, 'admins'],
    ...schemaDefaultValue(false),
  },
  subforumEmailNotifications: {
    type: Boolean,
    nullable: false,
    optional: false,
    control: "SubforumEmailNotifications",
    canRead: [userOwns, 'admins'],
    canCreate: ['members', 'admins'],
    canUpdate: [userOwns, 'admins'],
    ...schemaDefaultValue(false),
  },
};

export const UserTagRels: UserTagRelsCollection = createCollection({
  collectionName: 'UserTagRels',
  typeName: 'UserTagRel',
  schema,
  resolvers: getDefaultResolvers('UserTagRels'),
  mutations: getDefaultMutations('UserTagRels', {
    //, FIXME is this necessary/correct?
    newCheck: (user: DbUser|null, userTagRel: DbUserTagRel|null) => {
      return Boolean(userCanUseTags(user) && userTagRel);
    },
    editCheck: (user: DbUser|null, userTagRel: DbUserTagRel|null) => {
      return userCanUseTags(user);
    },
    removeCheck: (user: DbUser|null, userTagRel: DbUserTagRel|null) => {
      return false;
    },
  }),
  logChanges: true,
});
addUniversalFields({collection: UserTagRels})

UserTagRels.checkAccess = async (currentUser: DbUser|null, userTagRel: DbUserTagRel, context: ResolverContext|null): Promise<boolean> => {
  if (userIsAdmin(currentUser) || userOwns(currentUser, userTagRel)) { // admins can always see everything, users can always see their own posts
    return true;
  } else {
    return false;
  }
}

ensureIndex(UserTagRels, {tagId:1, userId:1}, {unique: true});

export default UserTagRels;
