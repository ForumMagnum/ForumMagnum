import schema from "@/lib/collections/userBlocks/newSchema";
import { UserBlocksViews } from "@/lib/collections/userBlocks/views";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlUserBlockQueryTypeDefs = gql`
  type UserBlock ${getAllGraphQLFields(schema)}
  
  input SingleUserBlockInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleUserBlockOutput {
    result: UserBlock
  }
  
  input UserBlocksUserAndBlockedUserInput {
    userId: String
    blockedUserId: String
    blocked: Boolean
  }
  
  input UserBlockSelector {
    default: EmptyViewInput
    userAndBlockedUser: UserBlocksUserAndBlockedUserInput
  }
  
  input MultiUserBlockInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiUserBlockOutput {
    results: [UserBlock!]!
    totalCount: Int
  }
  
  extend type Query {
    userBlock(
      input: SingleUserBlockInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleUserBlockOutput
    userBlocks(
      input: MultiUserBlockInput @deprecated(reason: "Use the selector field instead"),
      selector: UserBlockSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiUserBlockOutput
  }
`;

export const userBlockGqlQueryHandlers = getDefaultResolvers("UserBlocks", UserBlocksViews);
export const userBlockGqlFieldResolvers = getFieldGqlResolvers("UserBlocks", schema);
