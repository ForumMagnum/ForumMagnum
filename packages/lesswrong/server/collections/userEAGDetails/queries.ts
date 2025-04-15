import schema from "@/lib/collections/userEAGDetails/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlUserEAGDetailQueryTypeDefs = gql`
  type UserEAGDetail {
    ${getAllGraphQLFields(schema)}
  }

  input SingleUserEAGDetailInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleUserEAGDetailOutput {
    result: UserEAGDetail
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
    userEAGDetail(input: SingleUserEAGDetailInput): SingleUserEAGDetailOutput
    userEAGDetails(input: MultiUserEAGDetailInput): MultiUserEAGDetailOutput
  }
`;

export const userEAGDetailGqlQueryHandlers = getDefaultResolvers('UserEAGDetails');
export const userEAGDetailGqlFieldResolvers = getFieldGqlResolvers('UserEAGDetails', schema);
