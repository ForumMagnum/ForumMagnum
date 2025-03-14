// Functions for defining the GraphQL schema and API. Stores the added schemas
// in global variables, where the server (but not the client) may wind up
// handing them to graphql libraries.

import deepmerge from 'deepmerge';

// additional schemas
let schemas: string[] = [];
export const addGraphQLSchema = (schema: string) => {
  schemas.push(schema);
}

// get extra schemas defined manually
export const getAdditionalSchemas = () => {
  const additionalSchemas = schemas.join('\n');
  return additionalSchemas;
}

// queries
export type QueryAndDescription = {query: string, description?: string};
export const queries: QueryAndDescription[] = [];
export const addGraphQLQuery = (query: string, description?: string) => {
  queries.push({ query, description });
}

// mutations
export type MutationAndDescription = {mutation: string, description?: string}
export const mutations: MutationAndDescription[] = [];
export const addGraphQLMutation = (mutation: string, description?: string) => {
  mutations.push({ mutation, description });
}

// add resolvers
let resolvers: any = {};
export const addGraphQLResolvers = (addedResolvers: any) => {
  resolvers = deepmerge(resolvers, addedResolvers);
}
export const getResolvers = () => resolvers;
