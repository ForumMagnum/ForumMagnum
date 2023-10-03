import { markdownToHtml, dataToMarkdown } from '../editor/conversionUtils';
import Users from '../../lib/collections/users/collection';
import { augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema, slugify, updateMutator, Utils } from '../vulcan-lib';
import pick from 'lodash/pick';
import SimpleSchema from 'simpl-schema';
import {getUserEmail} from "../../lib/collections/users/helpers";
import {userFindOneByEmail} from "../commonQueries";
import {forumTypeSetting} from '../../lib/instanceSettings';
import ReadStatuses from '../../lib/collections/readStatus/collection';
import moment from 'moment';
import Posts from '../../lib/collections/posts/collection';
import countBy from 'lodash/countBy';
import entries from 'lodash/fp/entries';
import sortBy from 'lodash/sortBy';
import last from 'lodash/fp/last';
import Tags, { EA_FORUM_COMMUNITY_TOPIC_ID } from '../../lib/collections/tags/collection';
import Comments from '../../lib/collections/comments/collection';
import sumBy from 'lodash/sumBy';
import { getAnalyticsConnection } from "../analytics/postgresConnection";
import GraphQLJSON from 'graphql-type-json';
import { getRecentKarmaInfo, rateLimitDateWhenUserNextAbleToComment, rateLimitDateWhenUserNextAbleToPost } from '../rateLimitUtils';
import { RateLimitInfo, RecentKarmaInfo } from '../../lib/rateLimits/types';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { UsersRepo } from '../repos';

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
      type: "String",
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
  type MostReadAuthor {
    slug: String,
    displayName: String,
    count: Int
  }
  type MostReadTopic {
    slug: String,
    name: String,
    count: Int
  }
  type WrappedDataByYear {
    alignment: String,
    totalSeconds: Int,
    engagementPercentile: Float,
    postsReadCount: Int,
    mostReadAuthors: [MostReadAuthor],
    mostReadTopics: [MostReadTopic],
    postCount: Int,
    topPost: Post,
    commentCount: Int,
    topComment: Comment,
    shortformCount: Int,
    topShortform: Comment,
    karmaChange: Int
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
      if (forumTypeSetting.get() === "EAForum" && !acceptedTos) {
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
          slug: await Utils.getUnusedSlugByCollectionName("Users", slugify(username)),
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
    // TODO: Deprecated
    async UserAcceptTos(_root: void, _args: {}, {currentUser}: ResolverContext) {
      if (!currentUser) {
        throw new Error('Cannot accept terms of use while not logged in');
      }
      const updatedUser = (await updateMutator({
        collection: Users,
        documentId: currentUser._id,
        set: {
          acceptedTos: true,
        },
        validate: false,
      })).data;
      return updatedUser.acceptedTos;
    },
    async UserExpandFrontpageSection(
      _root: void,
      {section, expanded}: {section: string, expanded: boolean},
      {currentUser, repos}: ResolverContext,
    ) {
      if (!Users.isPostgres()) {
        throw new Error("Expanding frontpage sections requires Postgres");
      }
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
    async UserWrappedDataByYear(root: void, {year}: {year: number}, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        throw new Error('Must be logged in to view forum wrapped data')
      }

      // Get all the user's posts read for the given year
      const start = moment().year(year).dayOfYear(1).toDate()
      const end = moment().year(year+1).dayOfYear(0).toDate()
      const readStatuses = await ReadStatuses.find({
        userId: currentUser._id,
        isRead: true,
        lastUpdated: {$gte: start, $lte: end},
        postId: {$exists: true, $ne: null}
      }).fetch()
      
      // Filter out the posts that the user themselves authored or co-authored,
      // plus events and shortform posts
      const posts = (await Posts.find({
        _id: {$in: readStatuses.map(rs => rs.postId)},
        userId: {$ne: currentUser._id},
        isEvent: false,
        shortform: false,
      }, {projection: {userId: 1, coauthorStatuses: 1, tagRelevance: 1}}).fetch()).filter(p => {
        return !p.coauthorStatuses?.some(cs => cs.userId === currentUser._id)
      })
      
      // Get the top 3 authors that the user has read
      const userIds = posts.map(p => {
        let authors = p.coauthorStatuses?.map(cs => cs.userId) ?? []
        authors.push(p.userId)
        return authors
      }).flat()
      const authorCounts = countBy(userIds)
      const topAuthors = sortBy(entries(authorCounts), last).slice(-3).map(a => a![0])
      
      // Get the top 3 topics that the user has read (filtering out the Community topic)
      const tagIds = posts.map(p => Object.keys(p.tagRelevance ?? {}) ?? []).flat().filter(t => t !== EA_FORUM_COMMUNITY_TOPIC_ID)
      const tagCounts = countBy(tagIds)
      const topTags = sortBy(entries(tagCounts), last).slice(-3).map(t => t![0])
      
      // Get the number of posts, comments, and shortforms that the user posted this year,
      // including which were the most popular
      const [authors, topics, userPosts, userComments, userShortforms] = await Promise.all([
        Users.find({
          _id: {$in: topAuthors}
        }, {projection: {displayName: 1, slug: 1}}).fetch(),
        Tags.find({
          _id: {$in: topTags}
        }, {projection: {name: 1, slug: 1}}).fetch(),
        Posts.find({
          $or: [
            {userId: currentUser._id},
            {"coauthorStatuses.userId": currentUser._id}
          ],
          postedAt: {$gte: start, $lte: end},
          draft: false,
          deletedDraft: false,
          isEvent: false,
          isFuture: false,
          unlisted: false,
          shortform: false,
        }, {projection: {title: 1, slug: 1, baseScore: 1}, sort: {baseScore: -1}}).fetch(),
        Comments.find({
          userId: currentUser._id,
          postedAt: {$gte: start, $lte: end},
          deleted: false,
          postId: {$exists: true},
          $or: [
            {shortform: false},
            {topLevelCommentId: {$exists: true}}
          ]
        }, {projection: {postId: 1, baseScore: 1, contents: 1}, sort: {baseScore: -1}}).fetch(),
        Comments.find({
          userId: currentUser._id,
          postedAt: {$gte: start, $lte: end},
          deleted: false,
          shortform: true,
          topLevelCommentId: {$exists: false},
        }, {projection: {postId: 1, baseScore: 1, contents: 1}, sort: {baseScore: -1}}).fetch()
      ])
      
      let totalKarmaChange
      if (context.repos?.votes) {
        const karmaQueryArgs = {
          userId: currentUser._id,
          startDate: start,
          endDate: end,
          af: false,
          showNegative: true
        }
        const {changedComments, changedPosts, changedTagRevisions} = await context.repos.votes.getKarmaChanges(karmaQueryArgs);
        totalKarmaChange =
          sumBy(changedPosts, (doc: any)=>doc.scoreChange)
        + sumBy(changedComments, (doc: any)=>doc.scoreChange)
        + sumBy(changedTagRevisions, (doc: any)=>doc.scoreChange)
      }
      
      const results: AnyBecauseTodo = {
        ...await getEngagement(currentUser._id),
        postsReadCount: posts.length,
        mostReadAuthors: topAuthors.reverse().map(id => {
          const author = authors.find(a => a._id === id)
          return author ? {
            displayName: author.displayName,
            slug: author.slug,
            count: authorCounts[author._id]
          } : null
        }).filter(a => !!a),
        mostReadTopics: topTags.reverse().map(id => {
          const topic = topics.find(t => t._id === id)
          return topic ? {
            name: topic.name,
            slug: topic.slug,
            count: tagCounts[topic._id]
          } : null
        }).filter(t => !!t),
        postCount: userPosts.length,
        topPost: userPosts.shift() ?? null,
        commentCount: userComments.length,
        topComment: userComments.shift() ?? null,
        shortformCount: userShortforms.length,
        topShortform: userShortforms.shift() ?? null,
        karmaChange: totalKarmaChange
      }
      results['alignment'] = getAlignment(results)
      return results
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

function getAlignment(results: AnyBecauseTodo) {
  let goodEvil = 'neutral', lawfulChaotic = 'Neutral';
  if (results.engagementPercentile < 0.33) {
    goodEvil = 'evil'
  } else if  (results.engagementPercentile > 0.66) {
    goodEvil = 'good'
  }
  const ratio = results.commentCount / results.postCount;
  if (ratio < 3) {
    lawfulChaotic = 'Chaotic'
  } else if  (ratio > 6) {
    lawfulChaotic = 'Lawful'
  }
  if (lawfulChaotic == 'Neutral' && goodEvil  == 'neutral') {
    return 'True neutral'
  }
  return lawfulChaotic + ' ' + goodEvil
}

/*
  Note: this just returns the values from a materialized view that never automatically refreshes
  So the code for the materialized view will need to be changed if we do this in future years
*/
async function getEngagement (userId : string): Promise<{totalSeconds: number, engagementPercentile: number}> {
  const postgres = getAnalyticsConnection();
  if (!postgres) {
    return {
      totalSeconds: 0,
      engagementPercentile: 0
    }
  }

  const query = `
    with ranked as (
      select user_id
        , total_seconds
        , percent_rank() over (order by total_seconds asc) engagementPercentile
      from user_engagement_wrapped
      -- semi-arbitrarily exclude users with less than 1000 seconds from the ranking
      where total_seconds > 1000
    )
    select user_id
      , user_engagement_wrapped.total_seconds
      , coalesce(engagementPercentile, 0) engagementPercentile
    from user_engagement_wrapped
    left join ranked using (user_id)
    where user_id = $1`

  const pgResult = await postgres.query(query, [userId]);
  
  if (!pgResult || !pgResult.length) {
    return {
      totalSeconds: 0,
      engagementPercentile: 0
    }
  }
  
  return {
    totalSeconds: pgResult[0]['total_seconds'],
    engagementPercentile: pgResult[0]['engagementpercentile']
  }
}

addGraphQLMutation(
  'NewUserCompleteProfile(username: String!, subscribeToDigest: Boolean!, email: String, acceptedTos: Boolean): NewUserCompletedProfile'
)
// TODO: Derecated
addGraphQLMutation(
  'UserAcceptTos: Boolean'
)
addGraphQLMutation(
  'UserExpandFrontpageSection(section: String!, expanded: Boolean!): Boolean'
)
addGraphQLMutation(
  'UserUpdateSubforumMembership(tagId: String!, member: Boolean!): User'
)
addGraphQLQuery('UserWrappedDataByYear(year: Int!): WrappedDataByYear')
addGraphQLQuery('GetRandomUser(userIsAuthor: String!): User')

addGraphQLResolvers({
  Query: {
    async SuggestedDialogueUsers(root: void, args: {limit: number|undefined}, context: ResolverContext) {
      const usersRepo = new UsersRepo()
      const users = await usersRepo.get10000karmaUsers()
      return {
        users: users
      }
    }
  }
})

addGraphQLSchema(`
  type SuggestedDialogueUsersResult {
   users: [User!]
  }
`);

addGraphQLQuery('SuggestedDialogueUsers(limit: Int): SuggestedDialogueUsersResult')
