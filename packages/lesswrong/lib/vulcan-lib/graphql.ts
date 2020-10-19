// TODO: this should not be loaded on the client?

/*

Utilities to generate the app's GraphQL schema

*/

import deepmerge from 'deepmerge';
import './config';
import * as _ from 'underscore';


// collections used to auto-generate schemas
let collections: any = [];
export const addGraphQLCollection = (collection) => {
  collections.push(collection);
}
export const getCollections = () => collections;

// additional schemas
let schemas: any = [];
export const addGraphQLSchema = (schema) => {
  schemas.push(schema);
}

// get extra schemas defined manually
export const getAdditionalSchemas = () => {
  const additionalSchemas = schemas.join('\n');
  return additionalSchemas;
}

// queries
export const queries: any = [];
export const addGraphQLQuery = (query, description?: string) => {
  queries.push({ query, description });
}

// mutations
export const mutations: any = [];
export const addGraphQLMutation = (mutation, description?: string) => {
  mutations.push({ mutation, description });
}

// add resolvers
let resolvers: any = {};
export const addGraphQLResolvers = (addedResolvers) => {
  resolvers = deepmerge(resolvers, addedResolvers);
}
export const getResolvers = () => resolvers;
export const removeGraphQLResolver = (typeName, resolverName) => {
  delete resolvers[typeName][resolverName];
}

// add objects to context
let context: any = {};
export const addToGraphQLContext = (object) => {
  context = deepmerge(context, object);
}
export const getContext = () => context;

let directives: any = {};
export const addGraphQLDirective = (directive) => {
  directives = deepmerge(directives, directive);
}
export const getDirectives = () => directives;
