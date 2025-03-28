import { getAllCollections } from '@/server/collections/allCollections';
import { generateSchema, resolvers, typeDefs } from './initGraphQL';
import deepmerge from 'deepmerge';
import GraphQLJSON from 'graphql-type-json';
import GraphQLDate from './graphql-date';
import gql from 'graphql-tag';

const mutationsToGraphQL = (mutations: {mutation: string, description?: string}[]): string =>
  mutations.length > 0
    ? `
${
        mutations.length > 0
          ? `type Mutation {

${mutations
              .map(m => `${
                m.description
                  ? `  # ${m.description}\n`
                  : ''
              }  ${m.mutation}\n`)
              .join('\n')}
}
`
          : ''
      }

`
    : '';

const queriesToGraphQL = (queries: {query: string, description?: string}[]): string =>
  `type Query {
${queries.map(q =>
        `${
          q.description
            ? `  # ${q.description}\n`
            : ''
        }  ${q.query}
  `
    )
    .join('\n')}
}
`

// generate GraphQL schemas for all registered collections
const getTypeDefs = () => {
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
  const { schemaText, addedResolvers } = getTypeDefs();
  
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
