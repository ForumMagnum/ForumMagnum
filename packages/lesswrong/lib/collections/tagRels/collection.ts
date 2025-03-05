import { createCollection } from '../../vulcan-lib/collections';
import { foreignKeyField, resolverOnlyField, schemaDefaultValue } from '../../utils/schemaUtils'
import { userCanUseTags } from '../../betas';
import { canVoteOnTagAsync } from '../../voting/tagRelVoteRules';
import { isEAForum } from '../../instanceSettings';
import { userOwns } from '../../vulcan-users/permissions';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const schema: SchemaType<"TagRels"> = {
  ...addUniversalFields({}),
  tagId: {
    nullable: false,
    ...foreignKeyField({
      idFieldName: "tagId",
      resolverName: "tag",
      collectionName: "Tags",
      type: "Tag",
      nullable: true,
    }),
    canRead: ['guests'],
    canCreate: ['members'],
  },
  postId: {
    nullable: false,
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
    canRead: ['guests'],
    canCreate: ['members'],
  },
  deleted: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    hidden: true,
    optional: true,
    ...schemaDefaultValue(false),
  },
  // The user who first tagged the post with this tag
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    nullable: true,
    // Hide who applied the tag on the EA Forum
    canRead: isEAForum ? [userOwns, 'sunshineRegiment', 'admins'] : ['guests'],
    canCreate: ['members'],
  },

  currentUserCanVote: resolverOnlyField({
    type: Boolean,
    graphQLtype: 'Boolean!',
    canRead: ['guests'],
    resolver: async (document: DbTagRel, args: void, context: ResolverContext): Promise<boolean> => {
      // Return true for a null user so we can show them a login/signup prompt
      return context.currentUser
        ? !(await canVoteOnTagAsync(context.currentUser, document.tagId, document.postId, context, 'smallUpvote')).fail
        : true;
    },
  }),
  autoApplied: {
    type: Boolean,
    canRead: ['guests'],
    optional: true, hidden: true,
    // Implementation in tagResolvers.ts
  },
  // Indicates that a tagRel was applied via the script backfillParentTags.ts
  backfilled: {
    type: Boolean,
    canRead: ['guests'],
    optional: true,
    hidden: true,
    ...schemaDefaultValue(false),
  }
};

export const TagRels: TagRelsCollection = createCollection({
  collectionName: 'TagRels',
  typeName: 'TagRel',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('TagRels', {postId: 1});
    indexSet.addIndex('TagRels', {tagId: 1});
    return indexSet;
  },
  resolvers: getDefaultResolvers('TagRels'),
  mutations: getDefaultMutations('TagRels', {
    newCheck: (user: DbUser|null, tag: DbTagRel|null) => {
      return userCanUseTags(user);
    },
    editCheck: (user: DbUser|null, tag: DbTagRel|null) => {
      return userCanUseTags(user);
    },
    removeCheck: (user: DbUser|null, tag: DbTagRel|null) => {
      return false;
    },
  }),
  voteable: {
    timeDecayScoresCronjob: true,
    userCanVoteOn: (
      user: DbUser,
      document: DbTagRel,
      voteType: string|null,
      _extendedVote: any,
      context: ResolverContext,
    ) => canVoteOnTagAsync(user, document.tagId, document.postId, context, voteType ?? 'neutral'),
  },
});

TagRels.checkAccess = async (currentUser: DbUser|null, tagRel: DbTagRel, context: ResolverContext|null): Promise<boolean> => {
  if (userCanUseTags(currentUser))
    return true;
  else if (tagRel.deleted)
    return false;
  else
    return true;
}

export default TagRels;
