import schema from "@/lib/collections/llmRunTranscriptEntries/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlLlmRunTranscriptEntryQueryTypeDefs = gql`
  type LlmRunTranscriptEntry ${ getAllGraphQLFields(schema) }
`;

export const llmRunTranscriptEntryGqlFieldResolvers = getFieldGqlResolvers('LlmRunTranscriptEntries', schema);
