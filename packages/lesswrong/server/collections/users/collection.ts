import { userOwns, userCanDo } from '@/lib/vulcan-users/permissions';
import { createCollection } from "@/lib/vulcan-lib/collections";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import gql from 'graphql-tag';

export const Users = createCollection({
  collectionName: 'Users',
  typeName: 'User',
    resolvers: getDefaultResolvers('Users'),
  mutations: getDefaultMutations('Users', {
    editCheck: (user: DbUser|null, document: DbUser) => {
      if (!user || !document)
        return false;
  
      if (userCanDo(user, 'alignment.sidebar'))
        return true
  
      // OpenCRUD backwards compatibility
      return userOwns(user, document)
        ? userCanDo(user, ['user.update.own', 'users.edit.own'])
        : userCanDo(user, ['user.update.all', 'users.edit.all']);
    },
    // Anyone can create users
    newCheck: () => true,
    // Nobody can delete users
    removeCheck: () => false
  }),
  logChanges: true,
  dependencies: [
    {type: "extension", name: "pg_trgm"},
  ],
});

export const usersGraphQLTypeDefs = gql`
  extend type Query {
    currentUser: User
  }
`

export const usersGraphQLQueries = {
  async currentUser(root: void, args: void, context: ResolverContext) {
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
};

Users.postProcess = (user: DbUser): DbUser => {
  // The `node-postgres` library is smart enough to automatically convert string
  // representations of dates into Javascript Date objects when we have columns
  // of type TIMESTAMPTZ, however, it can't do this automatic conversion when the
  // date is hidden inside a JSON blob. Here, `partiallyReadSequences` is a
  // strongly typed JSON blob (using SimpleSchema) so we need to manually convert
  // to a Date object to avoid a GraphQL error.
  if (user.partiallyReadSequences) {
    for (const partiallyReadSequence of user.partiallyReadSequences) {
      partiallyReadSequence.lastReadTime = new Date(partiallyReadSequence.lastReadTime);
    }
  }
  return user;
}

export default Users;
