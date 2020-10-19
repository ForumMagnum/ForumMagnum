/**
 * Init the graphQL schema
 */

import { makeExecutableSchema } from 'apollo-server';
import { getAdditionalSchemas, getCollectionsSchemas, queries, mutations, getContext, getDirectives, getResolvers } from '../../../lib/vulcan-lib/graphql';
import { runCallbacks } from '../../../lib/vulcan-lib/callbacks';

const getQueries = () =>
  `type Query {
${queries
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
  mutations.length > 0
    ? `
${
        mutations.length > 0
          ? `type Mutation {

${mutations
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

${getAdditionalSchemas()}

${getCollectionsSchemas()}

${getQueries()}

${getMutations()}

`,
];

export const initGraphQL = () => {
  runCallbacks('graphql.init.before');
  const typeDefs = generateTypeDefs();
  executableSchema = makeExecutableSchema({
    typeDefs,
    resolvers: getResolvers(),
    schemaDirectives: getDirectives(),
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

export const getSchemaContextBase = () => getContext();

