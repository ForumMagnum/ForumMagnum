import schema from "@/lib/collections/llmMessages/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlLlmMessageQueryTypeDefs = gql`
  type LlmMessage ${
    getAllGraphQLFields(schema)
  }
`;

export const llmMessageGqlFieldResolvers = getFieldGqlResolvers('LlmMessages', schema);
