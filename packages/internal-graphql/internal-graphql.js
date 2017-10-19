import { withRenderContextEnvironment, GraphQLSchema, Collections } from 'meteor/vulcan:lib';
import { makeExecutableSchema } from 'graphql-tools';
import { graphql, print } from 'graphql';
import DataLoader from 'dataloader';
import deepmerge from 'deepmerge';

async function findByIds(collection, ids, context) {
  // get documents
  const documents = await collection.find({ _id: { $in: ids } }).fetch();
  // order documents in the same order as the ids passed as argument
  return ids.map(id => _.findWhere(documents, {_id: id}));
}

Meteor.startup(() => {
  const schema = makeExecutableSchema({
    typeDefs: GraphQLSchema.finalSchema,
    resolvers: GraphQLSchema.resolvers,
  });
  withRenderContextEnvironment(function (renderContext, req, res, next) {
    const context = renderContext;
    // const context = deepmerge({
    //   // My own extension to Vulcan.js.
    //   // It's really useful when you have access to the ApolloClient inside resolvers.
    //   // This makes it possible for resolvers to make their own queries.
    //   getRenderContext() { return renderContext; },
    //   // Copy over the userID.
    //   userId: req.loginContext ? req.loginContext.userId : undefined
    // }, GraphQLSchema.context);
    // go over context and add Dataloader to each collection
    Collections.forEach(collection => {
      context[collection.options.collectionName].loader = new DataLoader(ids => findByIds(collection, ids, context), {
        cache: true
      });
    });
    renderContext.apolloClient.networkInterface = {
      query: (request) => {
        return graphql(schema, print(request.query), {}, context, request.variables, request.debugName);
      }
    };
    next();
  }, { order: 23, name: 'internal-graphql-middleware' });
});
