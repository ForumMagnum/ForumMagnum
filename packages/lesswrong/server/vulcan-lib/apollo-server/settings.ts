import _merge from 'lodash/merge';

// NOTE: some option can be functions, so they cannot be
// defined as Meteor settings, which are pure JSON (no function)

// @see https://www.apollographql.com/docs/apollo-server/api/apollo-server.html#constructor-options-lt-ApolloServer-gt
let apolloServerOptions = {};
export const registerApolloServerOptions = options => {
  apolloServerOptions = _merge(apolloServerOptions, options);
};
export const getApolloServerOptions = () => apolloServerOptions;

// @see https://www.apollographql.com/docs/apollo-server/api/apollo-server.html#Parameters-2
let apolloApplyMiddlewareOptions = {};
export const registerApolloApplyMiddlewareOptions = options => {
  apolloApplyMiddlewareOptions = _merge(apolloApplyMiddlewareOptions, options);
};
export const getApolloApplyMiddlewareOptions = () => apolloApplyMiddlewareOptions;
