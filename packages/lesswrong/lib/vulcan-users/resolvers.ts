import { addGraphQLResolvers, Utils } from '../vulcan-lib';
import { asyncFilter } from '../utils/asyncUtils';
import { restrictViewableFields } from './permissions';

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

const defaultOptions = {
  cacheMaxAge: 300,
};

const resolvers = {
  multi: {
    async resolver(root: void, args: {input: {terms?: UsersViewTerms, enableCache?: boolean, enableTotal?: boolean}}, context: ResolverContext, { cacheControl }) {
      const { currentUser, Users } = context;
      const input = args?.input || {};
      const terms: UsersViewTerms = input.terms || {};
      const { enableCache = false, enableTotal = false } = input;

      if (cacheControl && enableCache) {
        const maxAge = defaultOptions.cacheMaxAge;
        cacheControl.setCacheHint({ maxAge });
      }

      // get selector and options from terms and perform Mongo query
      let { selector, options } = await Users.getParameters(terms);
      options.skip = terms.offset;
      const users: Array<DbUser> = await Utils.Connectors.find(Users, selector, options);

      // restrict documents via checkAccess
      const viewableUsers = Users.checkAccess
      ? await asyncFilter(users, async (doc: DbUser): Promise<boolean> => await Users.checkAccess(currentUser, doc, context))
      : users;

      // restrict documents fields
      const restrictedUsers = restrictViewableFields(currentUser, Users, viewableUsers);

      // prime the cache
      restrictedUsers.forEach(user => context.loaders.Users.prime(user._id, user));

      const data: any = { results: restrictedUsers };

      if (enableTotal) {
        // get total count of documents matching the selector
        data.totalCount = await Utils.Connectors.count(Users, selector);
      }

      return data;
    },
  },

  single: {
    async resolver(root, { input = {} }: any, context: ResolverContext, { cacheControl }) {
      const { currentUser, Users } = context;
      const { selector = {}, enableCache = false } = input;
      const { documentId, slug } = selector;

      if (cacheControl && enableCache) {
        const maxAge = defaultOptions.cacheMaxAge;
        cacheControl.setCacheHint({ maxAge });
      }

      // don't use Dataloader if user is selected by slug
      const user = documentId
        ? await context.loaders.Users.load(documentId)
        : slug
        ? await Utils.Connectors.get(Users, { slug })
        : await Utils.Connectors.get(Users);
      if (Users.checkAccess) {
        if (!await Users.checkAccess(currentUser, user, context)) return null
      }
      return { result: restrictViewableFields(currentUser, Users, user) };
    },
  },
};

export default resolvers;
