import { userCanUseTags } from "../../betas";
import { addUniversalFields, getDefaultMutations, getDefaultResolvers, schemaDefaultValue } from "../../collectionUtils";
import { forumTypeSetting } from "../../instanceSettings";
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
    hidden: true,
    ...schemaDefaultValue(true),
  },
  subforumEmailNotifications: {
    type: Boolean,
    nullable: false,
    optional: false,
    label: "Notify me of new threads",
    // control: "SubforumNotifications", // TODO: Possibly add this back in (it shows the batching settings in the menu)
    canRead: [userOwns, 'admins'],
    canCreate: ['members', 'admins'],
    canUpdate: [userOwns, 'admins'],
    ...schemaDefaultValue(true),
  },
};

export const UserTagRels: UserTagRelsCollection = createCollection({
  collectionName: 'UserTagRels',
  typeName: 'UserTagRel',
  collectionType: forumTypeSetting.get() === "EAForum" ? "switching" : "mongo",
  schema,
  resolvers: getDefaultResolvers('UserTagRels'),
  mutations: getDefaultMutations('UserTagRels', {
    newCheck: (user: DbUser|null, userTagRel: DbUserTagRel|null) => {
      return userCanUseTags(user);
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
  if (userIsAdmin(currentUser) || userOwns(currentUser, userTagRel)) { // admins can always see everything, users can always see their own settings
    return true;
  } else {
    return false;
  }
}

export default UserTagRels;
