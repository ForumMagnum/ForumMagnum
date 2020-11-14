import schema from './schema';
import { createCollection, addGraphQLQuery, addGraphQLResolvers } from '../../vulcan-lib';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { getDefaultMutations, getDefaultResolvers } from '../../collectionUtils';


const options = {
  updateCheck: (user: DbUser|null, document: DbUser) => {
    if (!user || !document) return false;

    if (userCanDo(user, 'alignment.sidebar')) {
      return true
    }

    // OpenCRUD backwards compatibility
    return userOwns(user, document) ? userCanDo(user, ['user.update.own', 'users.edit.own']) : userCanDo(user, ['user.update.all', 'users.edit.all']);
  },
  // Anyone can create users
  createCheck: () => true,
  // Nobody can delete users
  removeCheck: () => false
}


interface ExtendedUsersCollection extends UsersCollection {
  // Fron search/utils.ts
  toAlgolia: (user: DbUser) => Promise<Array<Record<string,any>>|null>
}

export const Users: ExtendedUsersCollection = createCollection({
  collectionName: 'Users',
  typeName: 'User',
  schema,
  resolvers: getDefaultResolvers('Users'),
  mutations: getDefaultMutations('Users', options),
});


const specificResolvers = {
  Query: {
    async currentUser(root, args, context: ResolverContext) {
      let user: any = null;
      const userId: string|null = (context as any)?.userId;
      if (userId) {
        user = await context.loaders.Users.load(userId);

        if (user.services) {
          Object.keys(user.services).forEach(key => {
            user.services[key] = {};
          });
        }
      }
      return user;
    },
  },
};

addGraphQLResolvers(specificResolvers);
addGraphQLQuery('currentUser: User');

export default Users;
