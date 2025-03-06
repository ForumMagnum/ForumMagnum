import { isEAForum } from "@/lib/instanceSettings";
import { foreignKeyField, schemaDefaultValue, resolverOnlyField } from "@/lib/utils/schemaUtils";
import { canVoteOnTagAsync } from "@/lib/voting/tagRelVoteRules";
import { userOwns } from "@/lib/vulcan-users/permissions";

const schema: SchemaType<"TagRels"> = {
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

export default schema;
