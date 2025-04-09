import schema from "@/lib/collections/userJobAds/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const graphqlUserJobAdQueryTypeDefs = gql`
  type UserJobAd ${
    getAllGraphQLFields(schema)
  }

  input SingleUserJobAdInput {
    selector: SelectorInput
    resolverArgs: JSON
    allowNull: Boolean
  }

  type SingleUserJobAdOutput {
    result: UserJobAd
  }

  input MultiUserJobAdInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiUserJobAdOutput {
    results: [UserJobAd]
    totalCount: Int
  }

  extend type Query {
    userJobAd(input: SingleUserJobAdInput): SingleUserJobAdOutput
    userJobAds(input: MultiUserJobAdInput): MultiUserJobAdOutput
  }
`;

export const userJobAdGqlQueryHandlers = getDefaultResolvers('UserJobAds');
export const userJobAdGqlFieldResolvers = getFieldGqlResolvers('UserJobAds', schema);
