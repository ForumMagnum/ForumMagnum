import { getModerationNewUsers, type ModerationNewUsersOptions } from "@/server/resolvers/moderationNewUsers";
import type { GraphQLResolveInfo } from "graphql";
import schema from "@/lib/collections/users/newSchema";
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";
import { UsersViews } from "@/lib/collections/users/views";

export const graphqlUserQueryTypeDefs = gql`
  type User ${ getAllGraphQLFields(schema) }

  enum ReactPaletteStyle {
    listView
    gridView
  }
  
  enum UserGroup {
    guests
    members
    admins
    sunshineRegiment
    alignmentForumAdmins
    alignmentForum
    alignmentVoters
    podcasters
    canBypassPostRateLimit
    trustLevel1
    canModeratePersonal
    canSuggestCuration
    debaters
    realAdmins
  }
  
  enum TagRelVoteGroup {
    guests
    members
    admins
    sunshineRegiment
    alignmentForumAdmins
    alignmentForum
    alignmentVoters
    podcasters
    canBypassPostRateLimit
    trustLevel1
    canModeratePersonal
    canSuggestCuration
    debaters
    realAdmins
    userOwns
    userOwnsOnlyUpvote
  }
  
  enum SubforumPreferredLayout {
    card
    list
  }

  enum ReviewGroup {
    newContent
    offboard
    highContext
    maybeSpam
    automod
    snoozeExpired
    unknown
  }

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
    userIds: [String!]
  }
  
  input UsersUsersProfileInput {
    userId: String
    slug: String
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
    reviewAdminUsers: EmptyViewInput
    usersWithPaymentInfo: EmptyViewInput
    usersWithOptedInToDialogueFacilitation: EmptyViewInput
    alignmentSuggestedUsers: EmptyViewInput
    usersTopKarma: EmptyViewInput
  }
  
  input MultiUserInput {
    terms: JSON
    resolverArgs: JSON
    enableTotal: Boolean
    enableCache: Boolean
  }
  
  type MultiUserOutput {
    results: [User!]!
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
const defaultUserQueryHandlers = getDefaultResolvers('Users', UsersViews);

interface UserListArgs extends ModerationNewUsersOptions {
  input?: unknown;
  selector?: UserSelector | null;
}

export const userGqlQueryHandlers = {
  ...defaultUserQueryHandlers,
  async users(root: void, args: UserListArgs, context: ResolverContext, info: GraphQLResolveInfo) {
    if (args.selector?.sunshineNewUsers) {
      return getModerationNewUsers(context, args);
    }
    return defaultUserQueryHandlers.users(root, { ...args, input: args.input }, context, info);
  },
};
export const userGqlFieldResolvers = getFieldGqlResolvers('Users', schema);
