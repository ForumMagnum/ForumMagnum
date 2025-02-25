import { userCanUseTags } from "../../betas";
import { foreignKeyField, schemaDefaultValue } from '../../utils/schemaUtils';
import { createCollection } from '../../vulcan-lib/collections';
import { userIsAdmin, userOwns } from "../../vulcan-users/permissions";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultMutations } from "../../vulcan-core/default_mutations";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

const schema: SchemaType<"UserTagRels"> = {
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
    nullable: false,
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    canRead: ['guests'],
    canCreate: ['members'],
  },
  /**
   * @deprecated: may be reintroduced in the future but currently this isn't used anywhere and keeping it up to date adds extra complexity
   */
  subforumLastVisitedAt: {
    type: Date,
    optional: true,
    nullable: true,
    hidden: true
  },
  subforumShowUnreadInSidebar: {
    type: Boolean,
    nullable: false,
    optional: true,
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
    optional: true,
    label: "Notify me of new discussions",
    // control: "SubforumNotifications", // TODO: Possibly add this back in (it shows the batching settings in the menu)
    canRead: [userOwns, 'admins'],
    canCreate: ['members', 'admins'],
    canUpdate: [userOwns, 'admins'],
    ...schemaDefaultValue(false),
  },
  subforumHideIntroPost: {
    type: Boolean,
    optional: true,
    hidden: true,
    label: "Don't show the intro post at the top of topic feeds",
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
