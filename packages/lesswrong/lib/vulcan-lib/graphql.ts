// Functions for defining the GraphQL schema and API. Stores the added schemas
// in global variables, where the server (but not the client) may wind up
// handing them to graphql libraries.

import deepmerge from 'deepmerge';
import './config';
import type { GraphQLResolveInfo } from 'graphql';


// collections used to auto-generate schemas
let collections: any = [];
export const addGraphQLCollection = (collection: any) => {
  collections.push(collection);
}
export const getCollections = () => collections;

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


export type GraphQLUnionTypeResolver<T extends readonly (keyof ObjectsByTypeName)[]> = (obj: ObjectsByTypeName[T[number]], context: ResolverContext, info: GraphQLResolveInfo) => T[number];

/**
 * Defines a GraphQL union type with its resolver.
 */
export const defineUnion = <
  Name extends string,
  T extends readonly (keyof ObjectsByTypeName)[],
  TypeResolver extends GraphQLUnionTypeResolver<T>
>({ name, types, resolveType }: {
  name: Name,
  types: T,
  // This type constraint ensures that `resolveType` can handle ALL types listed in the `types` array.
  // Without this constraint, TypeScript would allow functions that only handle a subset of the types
  // (due to function parameter contravariance), which would make it possible to forget to update the `resolveType` function
  // when adding a new type to the union, and could lead to bugs.
  resolveType: GraphQLUnionTypeResolver<T> extends TypeResolver ? TypeResolver : never,
}) => {
  // Add the union type definition to the schema
  addGraphQLSchema(`union ${name} = ${types.join(' | ')}`);
  
  // Add the __resolveType resolver
  addGraphQLResolvers({
    [name]: {
      __resolveType: resolveType
    }
  });

  return name;
};
