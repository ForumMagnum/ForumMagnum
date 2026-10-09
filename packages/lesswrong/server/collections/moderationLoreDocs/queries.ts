import schema from "@/lib/collections/moderationLoreDocs/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ModerationLoreDocsViews } from "@/lib/collections/moderationLoreDocs/views";

export const graphqlModerationLoreDocQueryTypeDefs = gql`
  type ModerationLoreDoc ${ getAllGraphQLFields(schema) }

  input SingleModerationLoreDocInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleModerationLoreDocOutput {
    result: ModerationLoreDoc
  }

  input ModerationLoreDocsLoreForUserInput {
    targetUserId: String
  }

  input ModerationLoreDocSelector {
    default: EmptyViewInput
    globalLore: EmptyViewInput
    loreForUser: ModerationLoreDocsLoreForUserInput
  }

  input MultiModerationLoreDocInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiModerationLoreDocOutput {
    results: [ModerationLoreDoc!]!
    totalCount: Int
  }

  extend type Query {
    moderationLoreDoc(
      input: SingleModerationLoreDocInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleModerationLoreDocOutput
    moderationLoreDocs(
      input: MultiModerationLoreDocInput @deprecated(reason: "Use the selector field instead"),
      selector: ModerationLoreDocSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiModerationLoreDocOutput
  }
`;
export const moderationLoreDocGqlQueryHandlers = getDefaultResolvers('ModerationLoreDocs', ModerationLoreDocsViews);
export const moderationLoreDocGqlFieldResolvers = getFieldGqlResolvers('ModerationLoreDocs', schema);
