import { addGraphQLResolvers, Utils } from '../vulcan-lib';
import * as _ from 'underscore';

const specificResolvers = {
  Query: {
    async currentUser(root, args, context) {
      let user: any = null;
      if (context && context.userId) {
        user = await context.Users.loader.load(context.userId);

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
    async resolver(root, { input = {} }: any, { currentUser, Users }, { cacheControl }) {
      const { terms = {}, enableCache = false, enableTotal = false } = input;

      if (cacheControl && enableCache) {
        const maxAge = defaultOptions.cacheMaxAge;
        cacheControl.setCacheHint({ maxAge });
      }

      // get selector and options from terms and perform Mongo query
      let { selector, options } = await Users.getParameters(terms);
      options.skip = terms.offset;
      const users = await Utils.Connectors.find(Users, selector, options);

      // restrict documents via checkAccess
      const viewableUsers = Users.checkAccess
      ? _.filter(users, doc => Users.checkAccess(currentUser, doc))
      : users;

      // restrict documents fields
      const restrictedUsers = Users.restrictViewableFields(currentUser, Users, viewableUsers);

      // prime the cache
      restrictedUsers.forEach(user => Users.loader.prime(user._id, user));

      const data: any = { results: restrictedUsers };

      if (enableTotal) {
        // get total count of documents matching the selector
        data.totalCount = await Utils.Connectors.count(Users, selector);
      }

      return data;
    },
  },

  single: {
    async resolver(root, { input = {} }: any, { currentUser, Users }, { cacheControl }) {
      const { selector = {}, enableCache = false } = input;
      const { documentId, slug } = selector;

      if (cacheControl && enableCache) {
        const maxAge = defaultOptions.cacheMaxAge;
        cacheControl.setCacheHint({ maxAge });
      }

      // don't use Dataloader if user is selected by slug
      const user = documentId
        ? await Users.loader.load(documentId)
        : slug
        ? await Utils.Connectors.get(Users, { slug })
        : await Utils.Connectors.get(Users);
      if (Users.checkAccess) {
        if (!Users.checkAccess(currentUser, user)) return null
      }
      return { result: Users.restrictViewableFields(currentUser, Users, user) };
    },
  },
};

export default resolvers;
