import { GraphQLSchema } from 'meteor/vulcan:core';

GraphQLSchema.addQuery(`userAgent: String!`);
GraphQLSchema.addResolvers({
  Query: {
    userAgent (root, args, context) {
      return context.getRenderContext().req.headers['user-agent'];
    }
  }
});
