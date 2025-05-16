import schema from "@/lib/collections/users/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { UsersViews } from "@/lib/collections/users/views";

export const graphqlUserQueryTypeDefs = gql`
  type User ${ getAllGraphQLFields(schema) }

  input UserSelectorUniqueInput {
    _id: String
    documentId: String
    slug: String
  }
  
  input SingleUserInput {
    selector: UserSelectorUniqueInput
    resolverArgs: JSON
  }
  
  type SingleUserOutput {
    result: User
  }
  
  input UsersUsersByUserIdsInput {
    userIds: String
  }
  
  input UsersUsersProfileInput {
    userId: String
    slug: String
  }
  
  input UsersTagCommunityMembersInput {
    hasBio: String
    profileTagId: String
  }
  
  input UserSelector {
    default: EmptyViewInput
    usersByUserIds: UsersUsersByUserIdsInput
    usersProfile: UsersUsersProfileInput
    LWSunshinesList: EmptyViewInput
    LWTrustLevel1List: EmptyViewInput
    LWUsersAdmin: EmptyViewInput
    usersWithBannedUsers: EmptyViewInput
    sunshineNewUsers: EmptyViewInput
    recentlyActive: EmptyViewInput
    allUsers: EmptyViewInput
    usersMapLocations: EmptyViewInput
    tagCommunityMembers: UsersTagCommunityMembersInput
    reviewAdminUsers: EmptyViewInput
    usersWithPaymentInfo: EmptyViewInput
    usersWithOptedInToDialogueFacilitation: EmptyViewInput
    alignmentSuggestedUsers: EmptyViewInput
  }
  
  input MultiUserInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
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
