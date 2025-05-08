import schema from "@/lib/collections/userEAGDetails/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { UserEAGDetailsViews } from "@/lib/collections/userEAGDetails/views";

export const graphqlUserEagDetailQueryTypeDefs = gql`
  type UserEAGDetail ${ getAllGraphQLFields(schema) }
  
  input SingleUserEagDetailInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleUserEagDetailOutput {
    result: UserEAGDetail
  }
  
  input UserEAGDetailDefaultViewInput
  
  input UserEAGDetailsDataByUserInput {
    userId: String
  }
  
  input UserEagDetailSelector  {
    default: UserEAGDetailDefaultViewInput
    dataByUser: UserEAGDetailsDataByUserInput
  }
  
  input MultiUserEagDetailInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiUserEagDetailOutput {
    results: [UserEAGDetail]
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
