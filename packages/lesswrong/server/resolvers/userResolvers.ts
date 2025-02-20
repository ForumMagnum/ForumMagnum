import { markdownToHtml, dataToMarkdown } from '../editor/conversionUtils';
import Users from '../../lib/collections/users/collection';
import { accessFilterMultiple, augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import pick from 'lodash/pick';
import SimpleSchema from 'simpl-schema';
import {getUserEmail, userCanEditUser, userGetDisplayName} from "../../lib/collections/users/helpers";
import {userFindOneByEmail} from "../commonQueries";
import { isEAForum } from '../../lib/instanceSettings';
import GraphQLJSON from 'graphql-type-json';
import { getRecentKarmaInfo, rateLimitDateWhenUserNextAbleToComment, rateLimitDateWhenUserNextAbleToPost } from '../rateLimitUtils';
import { RateLimitInfo, RecentKarmaInfo } from '../../lib/rateLimits/types';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import UsersRepo from '../repos/UsersRepo';
import { defineQuery } from '../utils/serverGraphqlUtil';
import { createPaginatedResolver } from './paginatedResolver';
import { getUnusedSlugByCollectionName } from '../utils/slugUtil';
import { slugify } from '@/lib/utils/slugify';
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../../lib/vulcan-lib/graphql";
import { updateMutator } from "../vulcan-lib/mutators";

addGraphQLSchema(`
  type CommentCountTag {
    name: String!
    comment_count: Int!
  }
  type TopCommentedTagUser {
    _id: ID!
    username: String!
    displayName: String!
    total_power: Float!
    tag_comment_counts: [CommentCountTag!]!
  }
  type UpvotedUser {
    _id: ID!
    username: String!
    displayName: String!
    total_power: Float!
    power_values: String!
    vote_counts: Int!
    total_agreement: Float!
    agreement_values: String!
    recently_active_matchmaking: Boolean!
  }
  type UserDialogueUsefulData {
    dialogueUsers: [User]
    topUsers: [UpvotedUser]
    activeDialogueMatchSeekers: [User]
  }
`)

augmentFieldsDict(Users, {
  htmlMapMarkerText: {
    ...denormalizedField({
      needsUpdate: (data: Partial<DbUser>) => ('mapMarkerText' in data),
      getValue: async (user: DbUser) => {
        if (!user.mapMarkerText) return "";
        return await markdownToHtml(user.mapMarkerText);
      }
    })
  },
  bio: {
    resolveAs: {
      type: "String",
      resolver: (user: DbUser, args: void, { Users }: ResolverContext) => {
        const bio = user.biography?.originalContents;
        if (!bio) return "";
        return dataToMarkdown(bio.data, bio.type);
      }
    }
  },
  htmlBio: {
    resolveAs: {
      type: "String!",
      resolver: (user: DbUser, args: void, { Users }: ResolverContext) => {
        const bio = user.biography;
        return bio?.html || "";
      }
    }
  },
  rateLimitNextAbleToComment: {
    nullable: true,
    resolveAs: {
      type: GraphQLJSON,
      arguments: 'postId: String',
      resolver: async (user: DbUser, args: {postId: string | null}, context: ResolverContext): Promise<RateLimitInfo|null> => {
        return rateLimitDateWhenUserNextAbleToComment(user, args.postId, context);
      }
    },
  },
  rateLimitNextAbleToPost: {
    nullable: true,
    resolveAs: {
      type: GraphQLJSON,
      arguments: 'eventForm: Boolean',
      resolver: async (user: DbUser, args: { eventForm?: boolean }, context: ResolverContext): Promise<RateLimitInfo|null> => {
        const { eventForm } = args
        if (eventForm) return null

        const rateLimit = await rateLimitDateWhenUserNextAbleToPost(user);
        if (rateLimit) {
          return rateLimit
        } else {
          return null
        }
      }
    }
  },
  recentKarmaInfo: {
    nullable: true,
    resolveAs: {
      type: GraphQLJSON,
      resolver: async (user: DbUser, args, context: ResolverContext): Promise<RecentKarmaInfo> => {
        return getRecentKarmaInfo(user._id)
      }
    }
  }
});

addGraphQLSchema(`
  type NewUserCompletedProfile {
    username: String,
    slug: String,
    displayName: String,
    subscribedToDigest: Boolean,
    usernameUnset: Boolean
  }
`)

type NewUserUpdates = {
  username: string
  email?: string
  subscribeToDigest: boolean
  acceptedTos: boolean
}

addGraphQLSchema(`
  type UserCoreTagReads {
    tagId: String,
    userReadCount: Int
  }
`)

addGraphQLResolvers({
  Mutation: {
    async NewUserCompleteProfile(root: void, { username, email, subscribeToDigest, acceptedTos }: NewUserUpdates, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        throw new Error('Cannot change username without being logged in')
      }
      // Check they accepted the terms of use
      if (isEAForum && !acceptedTos) {
        throw new Error("You must accept the terms of use to continue");
      }
      // Only for new users. Existing users should need to contact support to
      // change their usernames
      if (!currentUser.usernameUnset) {
        throw new Error('Only new users can set their username this way')
      }
      // Check for uniqueness
      const existingUser = await Users.findOne({username})
      if (existingUser && existingUser._id !== currentUser._id) {
        throw new Error('Username already exists')
      }
      // Check for someone setting an email when they already have one
      if (email && getUserEmail(currentUser)) {
        throw new Error('You already have an email address')
      }
      // Check for email uniqueness
      if (email && await userFindOneByEmail(email)) {
        throw new Error('Email already taken')
      }
      // Check for valid email
      if (email && !SimpleSchema.RegEx.Email.test(email)) {
        throw new Error('Invalid email')
      }
      const updatedUser = (await updateMutator({
        collection: Users,
        documentId: currentUser._id,
        set: {
          usernameUnset: false,
          username,
          displayName: username,
          slug: await getUnusedSlugByCollectionName("Users", slugify(username)),
          ...(email ? {email} : {}),
          subscribedToDigest: subscribeToDigest,
          acceptedTos,
        },
        // We've already done necessary gating
        validate: false
      })).data
      // Don't want to return the whole object without more permission checking
      return pick(updatedUser, 'username', 'slug', 'displayName', 'subscribedToCurated', 'usernameUnset')
    },
    async UserExpandFrontpageSection(
      _root: void,
      {section, expanded}: {section: string, expanded: boolean},
      {currentUser, repos}: ResolverContext,
    ) {
      if (!currentUser) {
        throw new Error("You must login to do this");
      }
      expanded = Boolean(expanded);
      await repos.users.setExpandFrontpageSection(currentUser._id, section, expanded);
      return expanded;
    },
    async UserUpdateSubforumMembership(root: void, { tagId, member }: {tagId: string, member: boolean}, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        throw new Error('Cannot join subforum without being logged in')
      }

      if ((member && currentUser.profileTagIds?.includes(tagId)) || (!member && !currentUser.profileTagIds?.includes(tagId))) {
        throw new Error(member ? 'User is aleady a member of this subforum' : 'User is not a member of this subforum so cannot leave')
      }

      const newProfileTagIds = member ? [...(currentUser.profileTagIds || []), tagId] : currentUser.profileTagIds?.filter(id => id !== tagId) || []
      const updatedUser = await updateMutator({
        collection: Users,
        documentId: currentUser._id,
        set: {
          profileTagIds: newProfileTagIds
        },
        validate: false
      })
      
      return updatedUser
    },
  },

  Query: {
    async UserReadsPerCoreTag(root: void, {userId}: {userId: string}, context: ResolverContext) {
      const { currentUser } = context
      const user = await Users.findOne({_id: userId})

      // Must be logged in and have permission to view this user's data
      if (!userId || !currentUser || !user || !userCanEditUser(currentUser, user)) {
        throw new Error('Not authorized')
      }
      
      return context.repos.posts.getUserReadsPerCoreTag(userId)
    },
    async GetRandomUser(root: void, {userIsAuthor}: {userIsAuthor: 'optional'|'required'}, context: ResolverContext) {
      const { currentUser } = context
      if (!userIsAdminOrMod(currentUser)) {
        throw new Error('Must be an admin/mod to get a random user')
      }
      
      if (userIsAuthor === 'optional') {
        return new UsersRepo().getRandomActiveUser()
      } else if (userIsAuthor === 'required') {
        return new UsersRepo().getRandomActiveAuthor()
      } else {
        throw new Error('Invalid user type type')
      }
    },
  },
})

addGraphQLMutation(
  'NewUserCompleteProfile(username: String!, subscribeToDigest: Boolean!, email: String, acceptedTos: Boolean): NewUserCompletedProfile'
)
addGraphQLMutation(
  'UserExpandFrontpageSection(section: String!, expanded: Boolean!): Boolean'
)
addGraphQLMutation(
  'UserUpdateSubforumMembership(tagId: String!, member: Boolean!): User'
)
addGraphQLQuery('UserReadsPerCoreTag(userId: String!): [UserCoreTagReads]')
addGraphQLQuery('GetRandomUser(userIsAuthor: String!): User')

defineQuery({
  name: "IsDisplayNameTaken",
  argTypes: "(displayName: String!)",
  resultType: "Boolean!",
  fn: async (
    _root: void,
    {displayName}: {displayName: string},
    context: ResolverContext,
  ) => {
    const {currentUser} = context;
    if (!currentUser) {
      throw new Error("You must be logged in to do this");
    }
    const isTaken = await context.repos.users.isDisplayNameTaken({ displayName, currentUserId: currentUser._id });
    return isTaken;
  }
});


createPaginatedResolver({
  name: "SuggestedFeedSubscriptionUsers",
  graphQLType: "User",
  callback: async (
    context: ResolverContext,
    limit: number,
  ): Promise<DbUser[]> => {
    const {currentUser} = context;

    if (!currentUser) {
      throw new Error("You must be logged to get suggsted users to subscribe to.");
    }

    return await context.repos.users.getSubscriptionFeedSuggestedUsers(currentUser._id, limit);
  }
});
