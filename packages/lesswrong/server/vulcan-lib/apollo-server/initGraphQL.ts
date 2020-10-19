/**
 * Init the graphQL schema
 */

import { makeExecutableSchema } from 'apollo-server';
import { GraphQLSchema } from '../../../lib/vulcan-lib/graphql';
import { runCallbacks } from '../../../lib/vulcan-lib/callbacks';

const getQueries = () =>
  `type Query {
${GraphQLSchema.queries
    .map(
      q =>
        `${
          q.description
            ? `  # ${q.description}
`
            : ''
        }  ${q.query}
  `
    )
    .join('\n')}
}

`;
const getMutations = () =>
  GraphQLSchema.mutations.length > 0
    ? `
${
        GraphQLSchema.mutations.length > 0
          ? `type Mutation {

${GraphQLSchema.mutations
              .map(
                m =>
                  `${
                    m.description
                      ? `  # ${m.description}
`
                      : ''
                  }  ${m.mutation}
`
              )
              .join('\n')}
}
`
          : ''
      }

`
    : '';
// typeDefs
const generateTypeDefs = () => [
  `
scalar JSON
scalar Date

${GraphQLSchema.getAdditionalSchemas()}

${GraphQLSchema.getCollectionsSchemas()}

${getQueries()}

${getMutations()}

`,
];

export const initGraphQL = () => {
  runCallbacks('graphql.init.before');
  const typeDefs = generateTypeDefs();
  executableSchema = makeExecutableSchema({
    typeDefs,
    resolvers: GraphQLSchema.resolvers,
    schemaDirectives: GraphQLSchema.directives,
  });

  return executableSchema;
};

let executableSchema: any = null;
export const getExecutableSchema = () => {
  if (!executableSchema) {
    throw new Error('Warning: trying to access executable schema before it has been created by the server.');
  }
  return executableSchema;
};

export const getSchemaContextBase = () => GraphQLSchema.context;

