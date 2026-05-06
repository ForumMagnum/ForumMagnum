import schema from "@/lib/collections/researchSandboxSessions/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ResearchSandboxSessionsViews } from "@/lib/collections/researchSandboxSessions/views";

export const graphqlResearchSandboxSessionQueryTypeDefs = gql`
  type ResearchSandboxSession ${ getAllGraphQLFields(schema) }

  input SingleResearchSandboxSessionInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleResearchSandboxSessionOutput {
    result: ResearchSandboxSession
  }

  input ResearchSandboxSessionsByUserAndProjectInput {
    userId: String
    projectId: String
  }

  input ResearchSandboxSessionSelector {
    default: EmptyViewInput
    byUserAndProject: ResearchSandboxSessionsByUserAndProjectInput
  }

  input MultiResearchSandboxSessionInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiResearchSandboxSessionOutput {
    results: [ResearchSandboxSession!]!
    totalCount: Int
  }

  extend type Query {
    researchSandboxSession(
      input: SingleResearchSandboxSessionInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleResearchSandboxSessionOutput
    researchSandboxSessions(
      input: MultiResearchSandboxSessionInput @deprecated(reason: "Use the selector field instead"),
      selector: ResearchSandboxSessionSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiResearchSandboxSessionOutput
  }
`;
export const researchSandboxSessionGqlQueryHandlers = getDefaultResolvers('ResearchSandboxSessions', ResearchSandboxSessionsViews);
export const researchSandboxSessionGqlFieldResolvers = getFieldGqlResolvers('ResearchSandboxSessions', schema);
