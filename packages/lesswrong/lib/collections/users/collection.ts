import schema from './schema';
import resolvers from '../../vulcan-users/resolvers';
import { createCollection, addGraphQLQuery, Utils } from '../../vulcan-lib';
import { Meteor } from 'meteor/meteor';

const performCheck = (mutation, user, document) => {
  if (!mutation.check(user, document))
    throw new Error(
      Utils.encodeIntlError({ id: 'app.mutation_not_allowed', value: `"${mutation.name}" on _id "${document._id}"` })
    );
};

const createMutation = {
  name: 'createUser',

  check(user, document) {
    if (!user) return false;
    // OpenCRUD backwards compatibility
    return Users.canDo(user, ['user.create', 'users.new']);
  },

  mutation(root, { data }, context) {
    const { Users, currentUser } = context;
    performCheck(this, currentUser, data);

    return Utils.createMutator({
      collection: Users,
      data,
      currentUser,
      validate: true,
      context,
    });
  },
};

const updateMutation = {
  name: 'updateUser',

  check(user, document) {
    if (!user || !document) return false;

    if (Users.canDo(user, 'alignment.sidebar')) {
      return true
    }

    // OpenCRUD backwards compatibility
    return Users.owns(user, document) ? Users.canDo(user, ['user.update.own', 'users.edit.own']) : Users.canDo(user, ['user.update.all', 'users.edit.all']);
  },

  async mutation(root, { selector, data }, context) {
    const { Users, currentUser } = context;

    const document = await Utils.Connectors.get(Users, selector);

    if (!document) {
      throw new Error(`Could not find document to update for selector: ${JSON.stringify(selector)}`);
    }
    
    performCheck(this, currentUser, document);

    return Utils.updateMutator({
      collection: Users,
      selector,
      data,
      currentUser,
      validate: true,
      context,
    });
  },
};

const deleteMutation = {
  name: 'deleteUser',

  check(user, document) {
    if (!user || !document) return false;
    // OpenCRUD backwards compatibility
    return Users.owns(user, document) ? Users.canDo(user, ['user.delete.own', 'users.remove.own']) : Users.canDo(user, ['user.delete.all', 'users.remove.all']);
  },

  async mutation(root, { selector }, context) {

    const { Users, currentUser } = context;

    const document = await Utils.Connectors.get(Users, selector);

    if (!document) {
      throw new Error(`Could not find document to delete for selector: ${JSON.stringify(selector)}`);
    }

    performCheck(this, currentUser, document);

    return Utils.deleteMutator({
      collection: Users,
      selector,
      currentUser,
      validate: true,
      context,
    });
  },
};
const mutations = {
  create: createMutation,
  update: updateMutation,
  delete: deleteMutation,

  // OpenCRUD backwards compatibility
  new: createMutation,
  edit: updateMutation,
  remove: deleteMutation,
};

interface ExtendedUsersCollection extends UsersCollection {
  // Functions from lib/collections/users/helpers.ts
  getDisplayName: any
  ownsAndInGroup: any
  isSharedOn: any
  canCollaborate: any
  canEditUsersBannedUserIds: any
  canModeratePost: any
  canCommentLock: any
  userIsBannedFromPost: any
  userIsBannedFromAllPosts: any
  userIsBannedFromAllPersonalPosts: any
  isAllowedToComment: any
  blockedCommentingReason: any
  emailAddressIsVerified: any
  getProfileUrl: any
  getProfileUrlFromSlug: any
  useMarkdownCommentEditor: any
  useMarkdownPostEditor: any
  canEdit: any
  getLocation: any
  getAggregateKarma: any
  getPostCount: any
  getCommentCount: any
  
  // From lib/alignment-forum/users/helpers.ts
  canSuggestPostForAlignment: any
  canMakeAlignmentPost: any
  
  // From lib/helpers.ts
  isSubscribedTo: any
  
  // From lib/vulcan-users/permissions.ts
  groups: any
  createGroup: any
  getGroups: any
  getActions: any
  isMemberOf: any
  canDo: any
  owns: any
  isAdmin: any
  isAdminById: any
  canReadField: any
  getViewableFields: any
  restrictViewableFields: any
  canCreateField: any
  canUpdateField: any
  
  // From lib/vulcan-users/helpers.ts
  getUser: any
  getUserName: any
  getDisplayNameById: any
  getEditUrl: any
  getTwitterName: any
  getGitHubName: any
  getEmail: any
  findLast: any
  timeSinceLast: any
  numberOfItemsInPast24Hours: any
  findByEmail: any
  
  // Fron search/utils.ts
  toAlgolia: any
}

export const Users: ExtendedUsersCollection = createCollection({
  collection: Meteor.users,
  collectionName: 'Users',
  typeName: 'User',
  schema,
  resolvers,
  mutations,
  description: 'A user object'
});

addGraphQLQuery('currentUser: User');

export default Users;
