import { slugify } from '@/lib/utils/slugify';
import pick from 'lodash/pick';
import SimpleSchema from '@/lib/utils/simpleSchema';
import { getUserEmail, userCanEditUser } from "../../lib/collections/users/helpers";
import { isEAForum, airtableApiKeySetting } from '../../lib/instanceSettings';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import Users from '../../server/collections/users/collection';
import { userFindOneByEmail } from "../commonQueries";
import UsersRepo from '../repos/UsersRepo';
import { createPaginatedResolver } from './paginatedResolver';
import { getUnusedSlugByCollectionName } from '../utils/slugUtil';
import gql from 'graphql-tag';
import { updateUser } from '../collections/users/mutations';
import { accessFilterSingle } from '@/lib/utils/schemaUtils';
import { backgroundTask } from '../utils/backgroundTask';

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
    tagId: String!,
    userReadCount: Int!
  }

  extend type Mutation{
    NewUserCompleteProfile(username: String!, subscribeToDigest: Boolean!, email: String, acceptedTos: Boolean): NewUserCompletedProfile
    UserExpandFrontpageSection(section: String!, expanded: Boolean!): Boolean
    UserUpdateSubforumMembership(tagId: String!, member: Boolean!): User
  }

  extend type Query {
    UserReadsPerCoreTag(userId: String!): [UserCoreTagReads!]!
    GetRandomUser(userIsAuthor: String!): User
    IsDisplayNameTaken(displayName: String!): Boolean!
    GetUserBySlug(slug: String!): User
    NetKarmaChangesForAuthorsOverPeriod(days: Int!, limit: Int!): [NetKarmaChangesForAuthorsOverPeriod!]!
    AirtableLeaderboards: [AirtableLeaderboardResult!]!
  }

  type NetKarmaChangesForAuthorsOverPeriod {
    userId: String,
    netKarma: Int
  }

  type AirtableLeaderboardResult {
    name: String!
    leaderboardAmount: Int
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
    if (isEAForum() && !acceptedTos) {
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
    const updatedUser = await updateUser({
      data: {
        usernameUnset: false,
        username,
        displayName: username,
        slug: await getUnusedSlugByCollectionName("Users", slugify(username)),
        ...(email ? { email } : {}),
        subscribedToDigest: subscribeToDigest,
        acceptedTos,
      }, selector: { _id: currentUser._id }
    }, context);
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
    const updatedUser = await updateUser({
      data: {
        profileTagIds: newProfileTagIds
      }, selector: { _id: currentUser._id }
    }, context)
    
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
  ...suggestedFeedQuery,
  async GetUserBySlug(root: void, { slug }: { slug: string }, context: ResolverContext) {
    const { Users } = context;

    const userBySlug = await Users.findOne({ slug });

    if (!userBySlug) {
      return null;
    }

    return accessFilterSingle(context.currentUser, 'Users', userBySlug, context);
  },
  async NetKarmaChangesForAuthorsOverPeriod(
    _root: void,
    {days, limit}: {days: number, limit: number},
    context: ResolverContext,
  ) {
    return await context.repos.votes.getNetKarmaChangesForAuthorsOverPeriod(days, limit);
  },
  async AirtableLeaderboards() {
    // If we have cached data
    if (airtableCache.data) {
      const isStale = Date.now() - airtableCache.timestamp > STALE_TIME_MS;

      // Start a background refresh if data is stale and no fetch is in progress
      if (isStale && !inFlightPromise) {
        backgroundTask(startAirtableFetch());
      }

      // Always return cached data (stale-while-revalidate pattern)
      return airtableCache.data;
    }

    // No cached data - wait for in-flight fetch or start a new one
    return inFlightPromise || startAirtableFetch();
  }
};

type AirtableLeaderboardResultType = {
  name: string;
  leaderboardAmount?: number;
};


async function fetchAirtableRecords(): Promise<AirtableLeaderboardResultType[]> {
  const baseId = "appUepxJdxacpehZz";
  const tableName = "Donors";
  const viewName = "LeaderBoard";

  const apiKey = airtableApiKeySetting.get();
  if (!apiKey) {
    throw new Error("Can't fetch Airtable records without an API key");
  }

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?view=${encodeURIComponent(viewName)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Airtable API responded with status ${response.status} - ${response.statusText}`);
  }

  // The data returned by Airtable has a "records" array.
  // Each "record" has a "fields" object containing the columns we need.
  const data = await response.json();
  const records = data.records || [];

  const unpackArray = (value: any) => Array.isArray(value) ? value[0] : value;

  // Transform "records" into our AirtableLeaderboardResultType format
  return records.map((record: any) => {
    const name = unpackArray(record.fields?.["Leaderboard Display Name"]) ?? "Unknown";
    const amountStr = unpackArray(record.fields?.["Leaderboard Amount"]) ?? "";
    return {
      name,
      leaderboardAmount: amountStr === "" ? undefined : parseInt(amountStr, 10),
    };
  });
}

let airtableCache: {
  data?: AirtableLeaderboardResultType[];
  timestamp: number;
} = {
  data: undefined,
  timestamp: 0,
};

const startAirtableFetch = async () => {
  inFlightPromise = (async () => {
    try {
      const freshData = await fetchAirtableRecords();
      airtableCache.data = freshData;
      airtableCache.timestamp = Date.now();
      return freshData;
    } finally {
      inFlightPromise = null;
    }
  })();
  return inFlightPromise;
};

// We'll keep track of whether we have an in-flight promise so that we don't trigger multiple fetches simultaneously.
let inFlightPromise: Promise<AirtableLeaderboardResultType[]> | null = null;

// We'll consider data stale if it's older than 10 minutes.
const STALE_TIME_MS = 1000 * 60 * 10;
