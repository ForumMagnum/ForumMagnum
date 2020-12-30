// Functions for defining the GraphQL schema and API. Stores the added schemas
// in global variables, where the server (but not the client) may wind up
// handing them to graphql libraries.

import deepmerge from 'deepmerge';
import './config';


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

let directives: any = {};
export const addGraphQLDirective = (directive) => {
  directives = deepmerge(directives, directive);
}
export const getDirectives = () => directives;
