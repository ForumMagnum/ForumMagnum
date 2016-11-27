import Telescope from 'meteor/nova:lib';

import './collection.js'
import './routes.js'


const termsSchema = `
  input Terms {
    view: String
    userId: String
    cat: String
    date: String
    after: String
    before: String
    enableCache: Boolean
    listId: String
    query: String # search query
    postId: String
  }
`;

Telescope.graphQL.addSchema(termsSchema);
