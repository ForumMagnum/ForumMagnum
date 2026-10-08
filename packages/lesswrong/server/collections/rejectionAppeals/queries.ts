import schema from "@/lib/collections/rejectionAppeals/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { RejectionAppealsViews } from "@/lib/collections/rejectionAppeals/views";

export const graphqlRejectionAppealQueryTypeDefs = gql`
  type RejectionAppeal ${ getAllGraphQLFields(schema) }

  enum RejectionAppealStatus {
    open
    approved
    denied
  }

  input SingleRejectionAppealInput {
    selector: SelectorInput
    resolverArgs: JSON
  }

  type SingleRejectionAppealOutput {
    result: RejectionAppeal
  }

  input RejectionAppealsUserAppealsInput {
    userId: String
  }

  input RejectionAppealSelector {
    default: EmptyViewInput
    openAppeals: EmptyViewInput
    userAppeals: RejectionAppealsUserAppealsInput
  }

  input MultiRejectionAppealInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }

  type MultiRejectionAppealOutput {
    results: [RejectionAppeal!]!
    totalCount: Int
  }

  extend type Query {
    rejectionAppeal(
      input: SingleRejectionAppealInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleRejectionAppealOutput
    rejectionAppeals(
      input: MultiRejectionAppealInput @deprecated(reason: "Use the selector field instead"),
      selector: RejectionAppealSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiRejectionAppealOutput
  }
`;

export const rejectionAppealGqlQueryHandlers = getDefaultResolvers('RejectionAppeals', RejectionAppealsViews);
export const rejectionAppealGqlFieldResolvers = getFieldGqlResolvers('RejectionAppeals', schema);
