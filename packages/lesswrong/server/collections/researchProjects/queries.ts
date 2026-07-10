import schema from "@/lib/collections/researchProjects/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ResearchProjectsViews } from "@/lib/collections/researchProjects/views";

export const graphqlResearchProjectQueryTypeDefs = gql`
  type ResearchProject ${ getAllGraphQLFields(schema) }

  input SingleResearchProjectInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleResearchProjectOutput {
    result: ResearchProject
  }

  input ResearchProjectSelector {
    default: EmptyViewInput
  }

  input MultiResearchProjectInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiResearchProjectOutput {
    results: [ResearchProject!]!
    totalCount: Int
  }

  extend type Query {
    researchProject(
      selector: SelectorInput
    ): SingleResearchProjectOutput
    researchProjects(
      selector: ResearchProjectSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiResearchProjectOutput
  }
`;
export const researchProjectGqlQueryHandlers = getDefaultResolvers('ResearchProjects', ResearchProjectsViews);
export const researchProjectGqlFieldResolvers = getFieldGqlResolvers('ResearchProjects', schema);
