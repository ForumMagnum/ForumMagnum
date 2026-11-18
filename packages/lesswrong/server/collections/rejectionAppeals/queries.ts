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

  type SingleRejectionAppealOutput {
    result: RejectionAppeal
  }

  input RejectionAppealSelector {
    default: EmptyViewInput
    openAppeals: EmptyViewInput
  }

  type MultiRejectionAppealOutput {
    results: [RejectionAppeal!]!
    totalCount: Int
  }

  extend type Query {
    rejectionAppeal(
      selector: SelectorInput
    ): SingleRejectionAppealOutput
    rejectionAppeals(
      selector: RejectionAppealSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiRejectionAppealOutput
  }
`;

export const rejectionAppealGqlQueryHandlers = getDefaultResolvers('RejectionAppeals', RejectionAppealsViews);
export const rejectionAppealGqlFieldResolvers = getFieldGqlResolvers('RejectionAppeals', schema);
