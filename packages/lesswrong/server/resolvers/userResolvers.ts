import { slugify } from '@/lib/utils/slugify';
import pick from 'lodash/pick';
import SimpleSchema from 'simpl-schema';
import { getUserEmail, userCanEditUser } from "../../lib/collections/users/helpers";
import { isEAForum } from '../../lib/instanceSettings';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import Users from '../../server/collections/users/collection';
import { userFindOneByEmail } from "../commonQueries";
import UsersRepo from '../repos/UsersRepo';
import { createPaginatedResolver } from './paginatedResolver';
import { getUnusedSlugByCollectionName } from '../utils/slugUtil';
import { updateMutator } from "../vulcan-lib/mutators";
import gql from 'graphql-tag';

type NewUserUpdates = {
  username: string
  email?: string
  subscribeToDigest: boolean
  acceptedTos: boolean
}

const {Query: suggestedFeedQuery, typeDefs: suggestedFeedTypeDefs} = createPaginatedResolver({
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

export const graphqlTypeDefs = gql`
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
  type NewUserCompletedProfile {
    username: String,
    slug: String,
    displayName: String,
    subscribedToDigest: Boolean,
    usernameUnset: Boolean
  }
  type UserCoreTagReads {
    tagId: String,
    userReadCount: Int
  }

  extend type Mutation{
    NewUserCompleteProfile(username: String!, subscribeToDigest: Boolean!, email: String, acceptedTos: Boolean): NewUserCompletedProfile
    UserExpandFrontpageSection(section: String!, expanded: Boolean!): Boolean
    UserUpdateSubforumMembership(tagId: String!, member: Boolean!): User
  }

  extend type Query {
    UserReadsPerCoreTag(userId: String!): [UserCoreTagReads]
    GetRandomUser(userIsAuthor: String!): User
    IsDisplayNameTaken(displayName: String!): Boolean!
  }

  ${suggestedFeedTypeDefs}
`

export const graphqlMutations = {
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
}

export const graphqlQueries = {
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
  async IsDisplayNameTaken (
    _root: void,
    {displayName}: {displayName: string},
    context: ResolverContext,
  ) {
    const {currentUser} = context;
    if (!currentUser) {
      throw new Error("You must be logged in to do this");
    }
    const isTaken = await context.repos.users.isDisplayNameTaken({ displayName, currentUserId: currentUser._id });
    return isTaken;
  },
  ...suggestedFeedQuery
}
