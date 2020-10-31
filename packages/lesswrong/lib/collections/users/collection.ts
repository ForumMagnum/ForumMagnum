import schema from './schema';
import resolvers from '../../vulcan-users/resolvers';
import { createCollection, addGraphQLQuery, Utils } from '../../vulcan-lib';
import { meteorUsersCollection } from '../../meteorAccounts';

const performCheck = (mutation, user: DbUser|null, document: DbUser) => {
  if (!mutation.check(user, document))
    throw new Error(
      Utils.encodeIntlError({ id: 'app.mutation_not_allowed', value: `"${mutation.name}" on _id "${document._id}"` })
    );
};

const createMutation = {
  name: 'createUser',

  check(user: DbUser|null, document: DbUser) {
    if (!user) return false;
    // OpenCRUD backwards compatibility
    return Users.canDo(user, ['user.create', 'users.new']);
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

    if (Users.canDo(user, 'alignment.sidebar')) {
      return true
    }

    // OpenCRUD backwards compatibility
    return Users.owns(user, document) ? Users.canDo(user, ['user.update.own', 'users.edit.own']) : Users.canDo(user, ['user.update.all', 'users.edit.all']);
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
    return Users.owns(user, document) ? Users.canDo(user, ['user.delete.own', 'users.remove.own']) : Users.canDo(user, ['user.delete.all', 'users.remove.all']);
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

export interface UserLocation {
  lat: number,
  lng: number,
  loading: boolean,
  known: boolean,
}

interface ExtendedUsersCollection extends UsersCollection {
  // From lib/vulcan-users/permissions.ts
  groups: Record<string,any>
  createGroup: (groupName: string) => void
  getGroups: (user: UsersMinimumInfo|DbUser|null) => Array<string>
  getActions: (user: UsersMinimumInfo|DbUser|null) => Array<string>
  isMemberOf: (user: UsersCurrent|DbUser|null, group: string) => boolean
  canDo: (user: UsersMinimumInfo|DbUser|null, actionOrActions: string|Array<string>) => boolean
  owns: (user: UsersMinimumInfo|DbUser|null, document: HasUserIdType|DbUser|UsersMinimumInfo) => boolean
  isAdmin: (user: UsersMinimumInfo|DbUser|null) => boolean
  canReadField: (user: UsersCurrent|DbUser|null, field: any, document: any) => boolean
  restrictViewableFields: <T extends DbObject>(user: UsersCurrent|DbUser|null, collection: CollectionBase<T>, docOrDocs: T|Array<T>) => any
  canCreateField: any
  canUpdateField: any
  
  // From lib/vulcan-users/helpers.ts
  getUser: (userOrUserId: DbUser|string|undefined) => DbUser|null
  getUserName: (user: UsersMinimumInfo|DbUser|null) => string|null
  getDisplayNameById: (userId: string) => string
  getEditUrl: (user: DbUser|UsersMinimumInfo|null, isAbsolute?: boolean) => string
  getGitHubName: (user: DbUser) => string|null
  getEmail: (user: DbUser) => string|null
  findLast: <T extends HasCreatedAtType>(user: DbUser, collection: CollectionBase<T>, filter?: any) => T|null
  timeSinceLast: <T extends HasCreatedAtType>(user: DbUser, collection: CollectionBase<T>, filter?: any) => number
  numberOfItemsInPast24Hours: <T extends DbObject>(user: DbUser, collection: CollectionBase<T>, filter: Record<string,any>) => number
  findByEmail: (email: string) => DbUser|null
  
  // Fron search/utils.ts
  toAlgolia: (user: DbUser) => Promise<Array<Record<string,any>>|null>
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
