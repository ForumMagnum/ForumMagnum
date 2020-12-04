import schema from './schema';
import resolvers from '../../vulcan-users/resolvers';
import { createCollection, addGraphQLQuery } from '../../vulcan-lib';
import { Utils, encodeIntlError } from '../../vulcan-lib/utils';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { meteorUsersCollection } from '../../meteorAccounts';

const performCheck = (mutation, user: DbUser|null, document: DbUser) => {
  if (!mutation.check(user, document))
    throw new Error(
      encodeIntlError({ id: 'app.mutation_not_allowed', value: `"${mutation.name}" on _id "${document._id}"` })
    );
};

const createMutation = {
  name: 'createUser',

  check(user: DbUser|null, document: DbUser) {
    if (!user) return false;
    // OpenCRUD backwards compatibility
    return userCanDo(user, ['user.create', 'users.new']);
  },

  mutation(root: void, { data }, context: ResolverContext) {
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

  check(user: DbUser|null, document: DbUser) {
    if (!user || !document) return false;

    if (userCanDo(user, 'alignment.sidebar')) {
      return true
    }

    // OpenCRUD backwards compatibility
    return userOwns(user, document) ? userCanDo(user, ['user.update.own', 'users.edit.own']) : userCanDo(user, ['user.update.all', 'users.edit.all']);
  },

  async mutation(root: void, { selector, data }, context: ResolverContext) {
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

  check(user: DbUser|null, document: DbUser) {
    if (!user || !document) return false;
    // OpenCRUD backwards compatibility
    return userOwns(user, document) ? userCanDo(user, ['user.delete.own', 'users.remove.own']) : userCanDo(user, ['user.delete.all', 'users.remove.all']);
  },

  async mutation(root: void, { selector }, context: ResolverContext) {

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
  // Fron search/utils.ts
  toAlgolia: (user: DbUser) => Promise<Array<AlgoliaDocument>|null>
}

export const Users: ExtendedUsersCollection = createCollection({
  collection: meteorUsersCollection,
  collectionName: 'Users',
  typeName: 'User',
  schema,
  resolvers,
  mutations,
});

addGraphQLQuery('currentUser: User');

export default Users;
