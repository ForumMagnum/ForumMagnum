import schema from "@/lib/collections/userEAGDetails/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { UserEAGDetailsViews } from "@/lib/collections/userEAGDetails/views";

export const graphqlUserEagDetailQueryTypeDefs = gql`
  type UserEagDetail ${ getAllGraphQLFields(schema) }
  
  input SingleUserEagDetailInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleUserEagDetailOutput {
    result: UserEagDetail
  }
  
  input UserEagDetailViewInput {
    userId: String
   }
  
  input UserEagDetailSelector @oneOf {
    default: UserEagDetailViewInput
    dataByUser: UserEagDetailViewInput
  }
  
  input MultiUserEagDetailInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiUserEagDetailOutput {
    results: [UserEagDetail]
    totalCount: Int
  }
  
  extend type Query {
    userEagDetail(
      input: SingleUserEagDetailInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleUserEagDetailOutput
    userEagDetails(
      input: MultiUserEagDetailInput @deprecated(reason: "Use the selector field instead"),
      selector: UserEagDetailSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiUserEagDetailOutput
  }
`;
export const userEagDetailGqlQueryHandlers = getDefaultResolvers('UserEAGDetails', UserEAGDetailsViews);
export const userEagDetailGqlFieldResolvers = getFieldGqlResolvers('UserEAGDetails', schema);
