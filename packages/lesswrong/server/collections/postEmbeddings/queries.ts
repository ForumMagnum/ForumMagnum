import schema from "@/lib/collections/postEmbeddings/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlPostEmbeddingQueryTypeDefs = gql`
  type PostEmbedding {
    ${getAllGraphQLFields(schema)}
  }

  input SinglePostEmbeddingInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SinglePostEmbeddingOutput {
    result: PostEmbedding
  }

  input MultiPostEmbeddingInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiPostEmbeddingOutput {
    results: [PostEmbedding]
    totalCount: Int
  }

  extend type Query {
    postEmbedding(input: SinglePostEmbeddingInput): SinglePostEmbeddingOutput
    postEmbeddings(input: MultiPostEmbeddingInput): MultiPostEmbeddingOutput
  }
`;

export const postEmbeddingGqlQueryHandlers = getDefaultResolvers('PostEmbeddings');
export const postEmbeddingGqlFieldResolvers = getFieldGqlResolvers('PostEmbeddings', schema);
