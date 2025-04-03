import { getAllCollections } from '@/server/collections/allCollections';
import { generateSchema, resolvers, typeDefs } from './initGraphQL';
import deepmerge from 'deepmerge';
import GraphQLJSON from 'graphql-type-json';
import GraphQLDate from './graphql-date';
import gql from 'graphql-tag';

const mutationsToGraphQL = (mutations: {mutation: string, description?: string}[]): string => {
  if (!mutations.length) return "";
  const sb: string[] = [];
  sb.push("type Mutation {\n");
  for (const m of mutations) {
    if (m.description)
      sb.push(`  # ${m.description}\n`);
    sb.push(`  ${m.mutation}\n`);
  }
  sb.push("}\n\n");
  return sb.join("");
}

const queriesToGraphQL = (queries: {query: string, description?: string}[]): string => {
  const sb: string[] = [];
  sb.push("type Query {\n");
  for (const q of queries) {
    if (q.description)
      sb.push(`  # ${q.description}\n`);
    sb.push(`  ${q.query}\n`);
  }
  sb.push("}\n\n");
  return sb.join("");
}

// generate GraphQL schemas for all registered collections
export const getGraphQLTypeDefs = () => {
  const schemaContents: Array<string> = [
    "scalar JSON",
    "scalar Date",
  ];

  const allQueries = [];
  const allMutations = [];
  const allResolvers: Array<any> = [];

  for (let collection of getAllCollections()) {
    const { schema, addedQueries, addedResolvers, addedMutations } = generateSchema(collection);

    for (let query of addedQueries) allQueries.push(query);
    for (let resolver of addedResolvers) allResolvers.push(resolver);
    for (let mutation of addedMutations) allMutations.push(mutation);

    schemaContents.push(schema);
  }

  schemaContents.push(queriesToGraphQL(allQueries));
  schemaContents.push(mutationsToGraphQL(allMutations));

  return {
    schemaText: schemaContents.join("\n"),
    addedResolvers: allResolvers,
  };
};


export const getGraphQLSchema = () => {
  const { schemaText, addedResolvers } = getGraphQLTypeDefs();
  
  let allResolvers = {
    JSON: GraphQLJSON,
    Date: GraphQLDate,
    ...resolvers
  };

  for (let addedResolverGroup of addedResolvers) {
    allResolvers = deepmerge(allResolvers, addedResolverGroup);
  }

  return {
    typeDefs: gql`
      ${gql`${schemaText}`}
      ${typeDefs}
    `,
    resolvers: allResolvers,
  }
};// generate a GraphQL schema corresponding to a given collection
