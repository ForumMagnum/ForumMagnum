import schema from "@/lib/collections/userEAGDetails/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { UserEAGDetailsViews } from "@/lib/collections/userEAGDetails/views";

export const graphqlUserEagDetailQueryTypeDefs = gql`
  type UserEAGDetail ${ getAllGraphQLFields(schema) }
  
  input SingleUserEAGDetailInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleUserEAGDetailOutput {
    result: UserEAGDetail
  }
  
  input UserEAGDetailDefaultViewInput
  
  input UserEAGDetailsDataByUserInput {
    userId: String
  }
  
  input UserEAGDetailSelector  {
    default: UserEAGDetailDefaultViewInput
    dataByUser: UserEAGDetailsDataByUserInput
  }
  
  input MultiUserEAGDetailInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiUserEAGDetailOutput {
    results: [UserEAGDetail]
    totalCount: Int
  }
  
  extend type Query {
    userEAGDetail(
      input: SingleUserEAGDetailInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleUserEAGDetailOutput
    userEAGDetails(
      input: MultiUserEAGDetailInput @deprecated(reason: "Use the selector field instead"),
      selector: UserEAGDetailSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiUserEAGDetailOutput
  }
`;
export const userEagDetailGqlQueryHandlers = getDefaultResolvers('UserEAGDetails', UserEAGDetailsViews);
export const userEagDetailGqlFieldResolvers = getFieldGqlResolvers('UserEAGDetails', schema);
