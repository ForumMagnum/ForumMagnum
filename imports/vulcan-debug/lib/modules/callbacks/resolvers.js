import { CallbackHooks } from 'vulcan:lib';

const resolvers = {

  multi: {

    resolver(root, {terms = {}}, context, info) {
      return { results: CallbackHooks, totalCount: CallbackHooks.length };
    },

  },

};

export default resolvers;