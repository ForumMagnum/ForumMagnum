import Telescope from 'meteor/nova:lib';

const resolvers = {
  list: {
    name: 'moviesList',
    resolver(root, {terms, offset, limit}, context, info) {
      const options = {
        sort: {createdAt: -1},
        limit,
        skip: offset,
      };
      return context.Movies.find({}, options).fetch();
    },
  },
  total: {
    name: 'moviesTotal',
    resolver(root, {terms}, context) {
      return context.Movies.find().count();
    },
  }
};

export default resolvers;