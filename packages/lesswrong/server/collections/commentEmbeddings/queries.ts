import schema from "@/lib/collections/commentEmbeddings/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlCommentEmbeddingQueryTypeDefs = () => gql`
  type CommentEmbedding ${ getAllGraphQLFields(schema) }
`;

export const commentEmbeddingGqlFieldResolvers = getFieldGqlResolvers('CommentEmbeddings', schema);
