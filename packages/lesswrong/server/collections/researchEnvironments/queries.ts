import schema from "@/lib/collections/researchEnvironments/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ResearchEnvironmentsViews } from "@/lib/collections/researchEnvironments/views";

export const graphqlResearchEnvironmentQueryTypeDefs = gql`
  type ResearchEnvironment ${ getAllGraphQLFields(schema) }

  input SingleResearchEnvironmentInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleResearchEnvironmentOutput {
    result: ResearchEnvironment
  }

  input ResearchEnvironmentsByProjectInput {
    projectId: String
  }

  input ResearchEnvironmentsByProjectArchivedInput {
    projectId: String
  }

  input ResearchEnvironmentSelector {
    default: EmptyViewInput
    byProject: ResearchEnvironmentsByProjectInput
    byProjectArchived: ResearchEnvironmentsByProjectArchivedInput
  }

  input MultiResearchEnvironmentInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiResearchEnvironmentOutput {
    results: [ResearchEnvironment!]!
    totalCount: Int
  }

  extend type Query {
    researchEnvironment(
      selector: SelectorInput
    ): SingleResearchEnvironmentOutput
    researchEnvironments(
      selector: ResearchEnvironmentSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiResearchEnvironmentOutput
  }
`;
export const researchEnvironmentGqlQueryHandlers = getDefaultResolvers('ResearchEnvironments', ResearchEnvironmentsViews);
export const researchEnvironmentGqlFieldResolvers = getFieldGqlResolvers('ResearchEnvironments', schema);
