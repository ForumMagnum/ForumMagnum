import schema from "@/lib/collections/userJobAds/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { UserJobAdsViews } from "@/lib/collections/userJobAds/views";

export const graphqlUserJobAdQueryTypeDefs = gql`
  type UserJobAd ${ getAllGraphQLFields(schema) }
  
  input SingleUserJobAdInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleUserJobAdOutput {
    result: UserJobAd
  }
  
  input UserJobAdDefaultViewInput
  
  input UserJobAdsAdsByUserInput {
    userId: String
  }
  
  input UserJobAdSelector  {
    default: UserJobAdDefaultViewInput
    adsByUser: UserJobAdsAdsByUserInput
  }
  
  input MultiUserJobAdInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiUserJobAdOutput {
    results: [UserJobAd]
    totalCount: Int
  }
  
  extend type Query {
    userJobAd(
      input: SingleUserJobAdInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleUserJobAdOutput
    userJobAds(
      input: MultiUserJobAdInput @deprecated(reason: "Use the selector field instead"),
      selector: UserJobAdSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiUserJobAdOutput
  }
`;
export const userJobAdGqlQueryHandlers = getDefaultResolvers('UserJobAds', UserJobAdsViews);
export const userJobAdGqlFieldResolvers = getFieldGqlResolvers('UserJobAds', schema);
