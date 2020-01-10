import { getDefaultResolvers, getDefaultMutations, createCollection } from 'meteor/vulcan:core';
import { addUniversalFields } from '../../collectionUtils'
import { foreignKeyField } from '../../utils/schemaUtils'
import { makeVoteable } from '../../make_voteable';
import Users from 'meteor/vulcan:users';

const schema = {
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
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
    }),
    canRead: ['guests'],
    canCreate: ['members'],
  },
  // The user who first tagged the post with this tag
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
  afBaseScore: {
    type: Number,
    optional: true,
    label: "Alignment Base Score",
    viewableBy: ['guests'],
  },

};

export const TagRels = createCollection({
  collectionName: 'TagRels',
  typeName: 'TagRel',
  schema,
  resolvers: getDefaultResolvers('TagRels'),
  mutations: getDefaultMutations('TagRels', {
    newCheck: (user, tag) => {
      return !!user;
    },
    editCheck: (user, tag) => {
      return Users.isAdmin(user);
    },
    removeCheck: (user, tag) => {
      return false;
    },
  }),
});

addUniversalFields({collection: TagRels})
makeVoteable(TagRels);

export default TagRels;
