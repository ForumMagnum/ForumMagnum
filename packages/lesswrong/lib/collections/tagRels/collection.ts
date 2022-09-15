import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations, schemaDefaultValue } from '../../collectionUtils'
import { foreignKeyField, resolverOnlyField } from '../../utils/schemaUtils'
import { makeVoteable } from '../../make_voteable';
import { userCanUseTags } from '../../betas';
import { userCanVoteOnTag } from '../../voting/tagRelVoteRules';
import GraphQLJSON from 'graphql-type-json';

const schema: SchemaType<DbTagRel> = {
  tagId: {
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
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
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
    canRead: ['guests'],
    canCreate: ['members'],
  },
  afBaseScore: {
    type: Number,
    optional: true,
    label: "Alignment Base Score",
    viewableBy: ['guests'],
  },

  afExtendedScore: {
    type: GraphQLJSON,
    optional: true,
    viewableBy: ['guests'],
  },

  currentUserCanVote: resolverOnlyField({
    type: Boolean,
    graphQLtype: 'Boolean',
    viewableBy: ['guests'],
    resolver: (document: DbTagRel, args: void, {currentUser}: ResolverContext) => {
      // Return true for a null user so we can show them a login/signup prompt
      return currentUser ? userCanVoteOnTag(currentUser, document.tagId) : true;
    },
  }),
};

export const TagRels: TagRelsCollection = createCollection({
  collectionName: 'TagRels',
  typeName: 'TagRel',
  schema,
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
});

TagRels.checkAccess = async (currentUser: DbUser|null, tagRel: DbTagRel, context: ResolverContext|null): Promise<boolean> => {
  if (userCanUseTags(currentUser))
    return true;
  else if (tagRel.deleted)
    return false;
  else
    return true;
}

addUniversalFields({collection: TagRels})
makeVoteable(TagRels, {
  timeDecayScoresCronjob: true,
  userCanVoteOn: (user: DbUser, document: DbTagRel) => userCanVoteOnTag(user, document.tagId),
});

export default TagRels;
