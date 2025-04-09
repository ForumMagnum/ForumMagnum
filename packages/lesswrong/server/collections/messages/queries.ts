import schema from "@/lib/collections/messages/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlMessageQueryTypeDefs = gql`
  type Message ${
    getAllGraphQLFields(schema)
  }

  input SingleMessageInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleMessageOutput {
    result: Message
  }

  input MultiMessageInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiMessageOutput {
    results: [Message]
    totalCount: Int
  }

  extend type Query {
    message(input: SingleMessageInput): SingleMessageOutput
    messages(input: MultiMessageInput): MultiMessageOutput
  }
`;

export const messageGqlQueryHandlers = getDefaultResolvers('Messages');
export const messageGqlFieldResolvers = getFieldGqlResolvers('Messages', schema);
