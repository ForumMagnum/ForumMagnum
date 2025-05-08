import schema from "@/lib/collections/postEmbeddings/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { CollectionViewSet } from "@/lib/views/collectionViewSet";

export const graphqlPostEmbeddingQueryTypeDefs = gql`
  type PostEmbedding ${ getAllGraphQLFields(schema) }
  
  input SinglePostEmbeddingInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SinglePostEmbeddingOutput {
    result: PostEmbedding
  }
  
  input PostEmbeddingViewInput
  
  input PostEmbeddingSelector @oneOf {
    default: PostEmbeddingViewInput
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
    postEmbedding(
      input: SinglePostEmbeddingInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SinglePostEmbeddingOutput
    postEmbeddings(
      input: MultiPostEmbeddingInput @deprecated(reason: "Use the selector field instead"),
      selector: PostEmbeddingSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiPostEmbeddingOutput
  }
`;
export const postEmbeddingGqlQueryHandlers = getDefaultResolvers('PostEmbeddings', new CollectionViewSet('PostEmbeddings', {}));
export const postEmbeddingGqlFieldResolvers = getFieldGqlResolvers('PostEmbeddings', schema);
