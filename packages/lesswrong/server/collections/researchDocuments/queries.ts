import schema from "@/lib/collections/researchDocuments/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { ResearchDocumentsViews } from "@/lib/collections/researchDocuments/views";

export const graphqlResearchDocumentQueryTypeDefs = gql`
  type ResearchDocument ${ getAllGraphQLFields(schema) }

  input SingleResearchDocumentInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleResearchDocumentOutput {
    result: ResearchDocument
  }

  input ResearchDocumentsByProjectInput {
    projectId: String
  }

  input ResearchDocumentsByProjectArchivedInput {
    projectId: String
  }

  input ResearchDocumentSelector {
    default: EmptyViewInput
    byProject: ResearchDocumentsByProjectInput
    byProjectArchived: ResearchDocumentsByProjectArchivedInput
  }

  input MultiResearchDocumentInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiResearchDocumentOutput {
    results: [ResearchDocument!]!
    totalCount: Int
  }

  extend type Query {
    researchDocument(
      selector: SelectorInput
    ): SingleResearchDocumentOutput
    researchDocuments(
      selector: ResearchDocumentSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiResearchDocumentOutput
  }
`;
export const researchDocumentGqlQueryHandlers = getDefaultResolvers('ResearchDocuments', ResearchDocumentsViews);
export const researchDocumentGqlFieldResolvers = getFieldGqlResolvers('ResearchDocuments', schema);
