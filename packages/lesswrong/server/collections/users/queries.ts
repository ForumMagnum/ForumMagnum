import schema from "@/lib/collections/users/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { UsersViews } from "@/lib/collections/users/views";

export const graphqlUserQueryTypeDefs = gql`
  type User ${ getAllGraphQLFields(schema) }
  
  input SingleUserInput {
    selector: SelectorInput
    resolverArgs: JSON
  }
  
  type SingleUserOutput {
    result: User
  }
  
  input UserViewInput {
    sort: String
    userId: String
    userIds: String
    slug: String
    lng: String
    lat: String
    profileTagId: String
    hasBio: String
   }
  
  input UserSelector @oneOf {
    default: UserViewInput
    usersByUserIds: UserViewInput
    usersProfile: UserViewInput
    LWSunshinesList: UserViewInput
    LWTrustLevel1List: UserViewInput
    LWUsersAdmin: UserViewInput
    usersWithBannedUsers: UserViewInput
    sunshineNewUsers: UserViewInput
    recentlyActive: UserViewInput
    allUsers: UserViewInput
    usersMapLocations: UserViewInput
    tagCommunityMembers: UserViewInput
    reviewAdminUsers: UserViewInput
    usersWithPaymentInfo: UserViewInput
    usersWithOptedInToDialogueFacilitation: UserViewInput
    alignmentSuggestedUsers: UserViewInput
  }
  
  input MultiUserInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
  }
  
  type MultiUserOutput {
    results: [User]
    totalCount: Int
  }
  
  extend type Query {
    user(
      input: SingleUserInput @deprecated(reason: "Use the selector field instead"),
      selector: SelectorInput
    ): SingleUserOutput
    users(
      input: MultiUserInput @deprecated(reason: "Use the selector field instead"),
      selector: UserSelector,
      limit: Int,
      offset: Int,
      enableTotal: Boolean
    ): MultiUserOutput
  }
`;
export const userGqlQueryHandlers = getDefaultResolvers('Users', UsersViews);
export const userGqlFieldResolvers = getFieldGqlResolvers('Users', schema);
