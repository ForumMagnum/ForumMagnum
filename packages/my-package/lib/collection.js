import Telescope from 'meteor/nova:lib';
import schema from './schema.js';
import resolvers from './resolvers.js';
import mutations from './mutations.js';

const Movies = Telescope.createCollection({

  collectionName: 'movies',

  typeName: 'Movie',

  schema,

  resolvers,

  mutations,

});

export default Movies;