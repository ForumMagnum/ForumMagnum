import schema, { createDisplayName } from './schema';
import { userOwns, userCanDo } from '../../vulcan-users/permissions';
import { formGroups } from './formGroups';
import { addSlugFields } from '@/lib/utils/schemaUtils';
import { createCollection } from "../../vulcan-lib/collections";
import { addGraphQLQuery, addGraphQLResolvers } from "../../vulcan-lib/graphql";
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultMutations } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";

export const Users = createCollection({
  collectionName: 'Users',
  typeName: 'User',
  schema,
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

addGraphQLResolvers({
  Query: {
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
  },
});
addGraphQLQuery('currentUser: User');

addUniversalFields({collection: Users});

addSlugFields({
  collection: Users,
  getTitle: (u) => u.displayName ?? createDisplayName(u),
  includesOldSlugs: true,
  onCollision: "rejectIfExplicit",
  slugOptions: {
    canUpdate: ['admins'],
    order: 40,
    group: formGroups.adminOptions,
  },
});

Users.checkAccess = async (user: DbUser|null, document: DbUser, context: ResolverContext|null): Promise<boolean> => {
  if (document && document.deleted && !userOwns(user, document)) return userCanDo(user, 'users.view.deleted')
  return true
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
