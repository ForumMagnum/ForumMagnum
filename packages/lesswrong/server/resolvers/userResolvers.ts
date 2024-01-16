import { markdownToHtml, dataToMarkdown } from '../editor/conversionUtils';
import Users from '../../lib/collections/users/collection';
import { accessFilterMultiple, augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema, slugify, updateMutator, Utils } from '../vulcan-lib';
import pick from 'lodash/pick';
import SimpleSchema from 'simpl-schema';
import {getUserEmail, userCanEditUser, userGetDisplayName} from "../../lib/collections/users/helpers";
import {userFindOneByEmail} from "../commonQueries";
import { isEAForum } from '../../lib/instanceSettings';
import ReadStatuses from '../../lib/collections/readStatus/collection';
import moment from 'moment';
import Posts from '../../lib/collections/posts/collection';
import countBy from 'lodash/countBy';
import entries from 'lodash/fp/entries';
import sortBy from 'lodash/sortBy';
import last from 'lodash/fp/last';
import range from 'lodash/range';
import Tags, { EA_FORUM_COMMUNITY_TOPIC_ID } from '../../lib/collections/tags/collection';
import Comments from '../../lib/collections/comments/collection';
import sumBy from 'lodash/sumBy';
import { getAnalyticsConnection } from "../analytics/postgresConnection";
import GraphQLJSON from 'graphql-type-json';
import { getFeatures, getRecentKarmaInfo, rateLimitDateWhenUserNextAbleToComment, rateLimitDateWhenUserNextAbleToPost } from '../rateLimitUtils';
import { AutoRateLimit, RateLimitInfo, RecentKarmaInfo } from '../../lib/rateLimits/types';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { UsersRepo } from '../repos';
import { defineQuery } from '../utils/serverGraphqlUtil';
import { UserDialogueUsefulData } from "../../components/users/DialogueMatchingPage";
import { eaEmojiPalette } from '../../lib/voting/eaEmojiPalette';
import { postStatuses } from '../../lib/collections/posts/constants';
import { getConfirmedCoauthorIds, userIsPostCoauthor } from '../../lib/collections/posts/helpers';
import {forumSelect} from '../../lib/forumTypeUtils';
import {autoCommentRateLimits, autoPostRateLimits } from '../../lib/rateLimits/constants';

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
  },
  activeRateLimits: {
    resolveAs: {
      type: GraphQLJSON,
      resolver: async (user: DbUser, args, context: ResolverContext): Promise<AutoRateLimit[]> => {
        const allRateLimits = [...forumSelect(autoPostRateLimits), ...forumSelect(autoCommentRateLimits)]
        const nonUniversalLimits = allRateLimits.filter(rateLimit => rateLimit.rateLimitType !== "universal")
        const features = await getFeatures(user)
        return nonUniversalLimits.filter(rateLimit => (rateLimit.isActive(user, features)))
      }
    }
  },
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
    shortName: String,
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

// TODO remove all the V2s when done
addGraphQLSchema(`
  type TagReadLikelihoodRatio {
    tagId: String,
    tagName: String,
    tagShortName: String,
    userReadCount: Int,
    readLikelihoodRatio: Float
  }
  type MostReadAuthorV2 {
    _id: String,
    slug: String,
    displayName: String,
    profileImageId: String,
    count: Int,
    engagementPercentile: Float
  }
  type TopCommentContents {
    html: String
  }
  type TopComment {
    _id: String,
    postedAt: Date,
    postId: String,
    postTitle: String,
    postSlug: String,
    baseScore: Int,
    extendedScore: JSON,
    contents: TopCommentContents
  }
  type MostReceivedReact {
    name: String,
    count: Int
  }
  type CombinedKarmaVals {
    date: Date!,
    postKarma: Int!,
    commentKarma: Int!
  }
  type WrappedDataByYearV2 {
    engagementPercentile: Float,
    postsReadCount: Int,
    totalSeconds: Int,
    daysVisited: [String],
    mostReadTopics: [MostReadTopic],
    relativeMostReadCoreTopics: [TagReadLikelihoodRatio]
    mostReadAuthors: [MostReadAuthorV2],
    topPosts: [Post],
    postCount: Int,
    authorPercentile: Float,
    topComment: TopComment,
    commentCount: Int,
    commenterPercentile: Float,
    topShortform: Comment,
    shortformCount: Int,
    shortformPercentile: Float,
    karmaChange: Int,
    combinedKarmaVals: [CombinedKarmaVals],
    mostReceivedReacts: [MostReceivedReact],
  }
`);

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
    // UserWrappedDataByYearV2 includes:
    // - You’re a top X% reader of the EA Forum
    // - You read X posts this year
    // - You spend N hours on the EA Forum
    // - You visited the EA Forum on X days in 2023
    // - You spent the most time on X topics
    // - Compared to other users, you spent more time on X core topics
    // - Your most-read author was Y
    // - Your top 5 most-read authors are A, B, C, D, E
    // - You’re in the top X% of Y’s readers (one of your top 5 most-read authors)
    // - Your highest-karma post in 2023 was N (and your next 3 highest-karma posts are A, B, C)
    // - You wrote X posts in total this year
    // - This means you're in the top Y% of post authors
    // - Your highest-karma comment in 2023 was N
    // - You wrote X comments in total this year
    // - This means you're in the top Y% of commenters
    // - Your highest-karma quick take in 2023 was N
    // - You wrote X quick takes in total this year
    // - This means you're in the top Y% of quick takes authors
    // - Your overall karma change this year was X (Y from comments, Z from posts)
    // - Others gave you X [most received react] reacts
    // - And X reacts in total (X insightful, Y helpful, Z changed my mind)
    async UserWrappedDataByYearV2(root: void, {userId, year}: {userId: string, year: number}, context: ResolverContext) {
      const { currentUser } = context
      const user = await Users.findOne({_id: userId})

      // Must be logged in and have permission to view this user's data
      if (!userId || !currentUser || !user || !userCanEditUser(currentUser, user)) {
        throw new Error('Not authorized')
      }

      // Get all the user's posts read for the given year
      const start = new Date(year, 0)
      const end = new Date(year + 1, 0)
      const readStatuses = await ReadStatuses.find({
        userId: user._id,
        isRead: true,
        lastUpdated: {$gte: start, $lte: end},
        postId: {$ne: null}
      }).fetch()

      // Filter out the posts that the user themselves authored or co-authored,
      // plus events and shortform posts
      const posts = (await Posts.find({
        _id: {$in: readStatuses.map(rs => rs.postId)},
        userId: {$ne: user._id},
        isEvent: false,
        shortform: false,
      }, {projection: {userId: 1, coauthorStatuses: 1, hasCoauthorPermission: 1, tagRelevance: 1}}).fetch()).filter(p => {
        return !userIsPostCoauthor(user, p);
      })

      // Get the top 5 authors that the user has read
      const userIds = posts.map(p => getConfirmedCoauthorIds(p).concat([p.userId])).flat()
      const authorCounts = countBy(userIds)
      const topAuthors = sortBy(entries(authorCounts), last).slice(-5).map(a => a![0]) as string[]

      const readAuthorStatsPromise = Promise.all(
        topAuthors.map(async (id) => ({
          authorUserId: id,
          ...(await context.repos.posts.getReadAuthorStats({ userId: user._id, authorUserId: id, year })),
        }))
      );

      // Get the top 4 topics that the user has read (filtering out the Community topic)
      const tagIds = posts.map(p => Object.keys(p.tagRelevance ?? {}) ?? []).flat()
      const tagCounts = countBy(tagIds)
      const topTags = sortBy(entries(tagCounts), last).slice(-4).map(t => t![0])

      // Get the number of posts, comments, and shortforms that the user posted this year,
      // including which were the most popular
      const [
        authors,
        topics,
        userPosts,
        userComments,
        userShortforms,
        postAuthorshipStats,
        commentAuthorshipStats,
        shortformAuthorshipStats,
        readAuthorStats,
        readCoreTagStats,
      ] = await Promise.all([
        Users.find(
          {
            _id: { $in: topAuthors },
          },
          { projection: { displayName: 1, slug: 1, profileImageId: 1 } }
        ).fetch(),
        Tags.find(
          {
            _id: { $in: topTags },
          },
          { projection: { name: 1, shortName: 1, slug: 1 } }
        ).fetch(),
        Posts.find(
          {
            $or: [{ userId: user._id }, { "coauthorStatuses.userId": user._id }],
            postedAt: { $gte: start, $lte: end },
            status: {$eq: postStatuses.STATUS_APPROVED},
            draft: false,
            deletedDraft: false,
            isEvent: false,
            isFuture: false,
            unlisted: false,
            shortform: false,
          },
          { projection: { title: 1, slug: 1, baseScore: 1 }, sort: { baseScore: -1 } }
        ).fetch(),
        Comments.find(
          {
            userId: user._id,
            postedAt: { $gte: start, $lte: end },
            needsReview: { $ne: true },
            retracted: { $ne: true },
            moderatorHat: { $ne: true },
            deleted: false,
            deletedPublic: { $ne: true },
            postId: { $exists: true },
            $or: [{ shortform: false }, { topLevelCommentId: { $exists: true } }],
          },
          { projection: { postId: 1, postedAt: 1, baseScore: 1, extendedScore: 1, contents: 1 }, sort: { baseScore: -1 } }
        ).fetch(),
        Comments.find(
          {
            userId: user._id,
            postedAt: { $gte: start, $lte: end },
            needsReview: { $ne: true },
            retracted: { $ne: true },
            moderatorHat: { $ne: true },
            deleted: false,
            deletedPublic: { $ne: true },
            shortform: true,
            topLevelCommentId: { $exists: false },
          },
          { projection: { postId: 1, postedAt: 1, baseScore: 1, extendedScore: 1, contents: 1 }, sort: { baseScore: -1 } }
        ).fetch(),
        context.repos.posts.getAuthorshipStats({ userId: user._id, year }),
        context.repos.comments.getAuthorshipStats({ userId: user._id, year, shortform: false }),
        context.repos.comments.getAuthorshipStats({ userId: user._id, year, shortform: true }),
        readAuthorStatsPromise,
        context.repos.posts.getReadCoreTagStats({ userId: user._id, year }),
      ]);

      const [postKarmaChanges, commentKarmaChanges] = await Promise.all([
        context.repos.votes.getDocumentKarmaChangePerDay({ documentIds: userPosts.map(({ _id }) => _id), startDate: start, endDate: end }),
        context.repos.votes.getDocumentKarmaChangePerDay({ documentIds: [...userComments.map(({ _id }) => _id), ...userShortforms.map(({ _id }) => _id)], startDate: start, endDate: end }),
      ]);
      
      // Format the data changes in a way that can be easily passed in to recharts
      // to display it as a stacked area chart that goes up and to the right.
      let postKarma = 0
      let commentKarma = 0
      const combinedKarmaVals = range(1, 366).map(i => {
        const day = moment('2023', 'YYYY').dayOfYear(i)
        if (postKarmaChanges?.length && moment(postKarmaChanges[0].window_start_key).isSame(day, 'date')) {
          try {
            const postKarmaChange = postKarmaChanges.shift()
            if (postKarmaChange) {
              postKarma += parseInt(postKarmaChange.karma_change)
            }
          } catch {
            // ignore
          }
        }
        if (commentKarmaChanges?.length && moment(commentKarmaChanges[0].window_start_key).isSame(day, 'date')) {
          try {
            const commentKarmaChange = commentKarmaChanges.shift()
            if (commentKarmaChange) {
              commentKarma += parseInt(commentKarmaChange.karma_change)
            }
          } catch {
            // ignore
          }
        }
        
        return {
          date: day.toDate(),
          postKarma,
          commentKarma
        }
      })

      let totalKarmaChange
      let mostReceivedReacts: { name: string, count: number }[] = []
      if (context.repos?.votes) {
        const karmaQueryArgs = {
          userId: user._id,
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

        const allAddedReacts = [
          ...changedComments.map(({ addedReacts }) => addedReacts).flat(),
          ...changedPosts.map(({ addedReacts }) => addedReacts).flat(),
        ].flat();

        const reactCounts = countBy(allAddedReacts, 'reactionType');
        // We're ignoring agree and disagree reacts.
        delete reactCounts.agree;
        delete reactCounts.disagree;
        mostReceivedReacts = (sortBy(entries(reactCounts), last) as [string, number][]).reverse().map(([name, count]) => ({
          name: eaEmojiPalette.find(emoji => emoji.name === name)?.label ?? '',
          count
        }));
      }

      const { engagementPercentile, totalSeconds, daysVisited }  = await getEngagementV2(user._id, year);
      const mostReadTopics = topTags
        .reverse()
        .map((id) => {
          const topic = topics.find((t) => t._id === id);
          return topic
            ? {
                name: topic.name,
                shortName: topic.shortName ?? topic.name,
                slug: topic.slug,
                count: tagCounts[topic._id],
              }
            : null;
        })
        .filter((t) => !!t);

      const mostReadAuthors = topAuthors.reverse().map(async id => {
        const author = authors.find(a => a._id === id)
        const authorStats = readAuthorStats.find(s => s.authorUserId === id)

        return author
          ? {
              _id: author._id,
              displayName: author.displayName,
              slug: author.slug,
              profileImageId: author.profileImageId,
              count: authorCounts[author._id],
              engagementPercentile: authorStats?.percentile ?? 0.0,
            }
          : null;
      }).filter(a => !!a);
      
      // add the post title and slug to the top comment
      const topComment: (DbComment & {postTitle?: string, postSlug?: string})|null = userComments.shift() ?? null;
      if (topComment) {
        const topCommentPost = await Posts.findOne({_id: topComment.postId}, {projection: {title: 1, slug: 1}})
        if (topCommentPost) {
          topComment.postTitle = topCommentPost.title
          topComment.postSlug = topCommentPost.slug
        }
      }

      const results: AnyBecauseTodo = {
        engagementPercentile,
        postsReadCount: posts.length,
        totalSeconds,
        daysVisited,
        mostReadTopics,
        relativeMostReadCoreTopics: readCoreTagStats.filter(stat => stat.readLikelihoodRatio > 0),
        mostReadAuthors,
        topPosts: userPosts.slice(0,4) ?? null,
        postCount: postAuthorshipStats.totalCount,
        authorPercentile: postAuthorshipStats.percentile,
        topComment,
        commentCount: commentAuthorshipStats.totalCount,
        commenterPercentile: commentAuthorshipStats.percentile,
        topShortform: userShortforms.shift() ?? null,
        shortformCount: shortformAuthorshipStats.totalCount,
        shortformPercentile: shortformAuthorshipStats.percentile,
        karmaChange: totalKarmaChange,
        combinedKarmaVals: combinedKarmaVals,
        mostReceivedReacts,
      }
      return results
    },
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
  if (lawfulChaotic === 'Neutral' && goodEvil  === 'neutral') {
    return 'True neutral'
  }
  return lawfulChaotic + ' ' + goodEvil
}

/*
  Note: this just returns the values from a materialized view that never automatically refreshes
  So the code for the materialized view will need to be changed if we do this in future years
*/
async function getEngagementV2(userId: string, year: number): Promise<{
  totalSeconds: number;
  daysVisited: string[];
  engagementPercentile: number;
}> {
  const postgres = getAnalyticsConnection();
  if (!postgres) {
    return {
      totalSeconds: 0,
      daysVisited: [],
      engagementPercentile: 0,
    };
  }

  const totalQuery = `
    WITH by_year AS (
      SELECT
        view_year,
        sum(total_seconds) AS total_seconds,
        user_id
      FROM
        user_engagement_wrapped_2023
      WHERE view_year = $2 AND user_id IS NOT NULL
      GROUP BY view_year, user_id
    ),
    ranked AS (
      SELECT
        user_id,
        total_seconds,
        percent_rank() OVER (ORDER BY total_seconds ASC) engagementPercentile
      FROM by_year
      -- semi-arbitrarily exclude users with less than 3600 seconds (1 hour) from the ranking
      WHERE total_seconds > 3600
    )
    SELECT
      user_id,
      by_year.total_seconds,
      coalesce(engagementPercentile, 0) engagementPercentile
    FROM
      by_year
      LEFT JOIN ranked USING (user_id)
    WHERE
      user_id = $1;
  `;

  const daysActiveQuery = `
    SELECT view_date::text FROM user_engagement_wrapped_2023 WHERE view_year = $2 AND user_id = $1 ORDER BY view_date ASC;
  `;

  const [totalResult, daysActiveResult] = await Promise.all([
    postgres.query(totalQuery, [userId, year]),
    postgres.query(daysActiveQuery, [userId, year])
  ]);

  const totalSeconds = totalResult?.[0]?.["total_seconds"] ?? 0;
  const engagementPercentile = totalResult?.[0]?.["engagementpercentile"] ?? 0;

  const daysVisited: string[] = daysActiveResult?.map((result: any) => result["view_date"]) ?? [];

  return {
    totalSeconds,
    daysVisited,
    engagementPercentile,
  };
}

/*
  Note: this just returns the values from a materialized view that never automatically refreshes
  So the code for the materialized view will need to be changed if we do this in future years
*/
async function getEngagement(userId : string): Promise<{totalSeconds: number, engagementPercentile: number}> {
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
addGraphQLQuery('UserWrappedDataByYearV2(userId: String!, year: Int!): WrappedDataByYearV2')
addGraphQLQuery('GetRandomUser(userIsAuthor: String!): User')

defineQuery({
  name: "GetUserDialogueUsefulData",
  resultType: "UserDialogueUsefulData",
  fn: async (root:void, _:any, context: ResolverContext) => {
    const { currentUser } = context
    if (!currentUser) {
      throw new Error('User must be logged in to get top upvoted users');
    }

    const [dialogueUsers, topUsers, activeDialogueMatchSeekers] = await Promise.all([
      new UsersRepo().getUsersWhoHaveMadeDialogues(),
      new UsersRepo().getUsersTopUpvotedUsers(currentUser),
      new UsersRepo().getActiveDialogueMatchSeekers(100),
    ]);

    const results: UserDialogueUsefulData = {
      dialogueUsers: dialogueUsers.map(user => ({ ...user, displayName: userGetDisplayName(user) })),
      topUsers: topUsers,
      activeDialogueMatchSeekers: activeDialogueMatchSeekers.map(user => ({ ...user, displayName: userGetDisplayName(user) })),
    }
    return results
  }
});

defineQuery({
  name: "GetDialogueMatchedUsers",
  resultType: "[User]!",
  fn: async (root, _, context) => {
    const { currentUser } = context
    if (!currentUser) {
      throw new Error('User must be logged in to get matched users');
    }

    const matchedUsers = await new UsersRepo().getDialogueMatchedUsers(currentUser._id);
    return accessFilterMultiple(currentUser, Users, matchedUsers, context);
  }
});

defineQuery({
  name: "GetDialogueRecommendedUsers",
  resultType: "[User]!",
  fn: async (root, _, context) => {
    const { currentUser } = context
    if (!currentUser) {
      throw new Error('User must be logged in to get recommended users');
    }

    const upvotedUsers = await context.repos.users.getUsersTopUpvotedUsers(currentUser, 35, 30)
    const recommendedUsers = await context.repos.users.getDialogueRecommendedUsers(currentUser._id, upvotedUsers);

    // Shuffle and limit the list to 2 users
    const shuffled = recommendedUsers.sort(() => 0.5 - Math.random());
    const sampleSize = 2;

    return accessFilterMultiple(currentUser, Users, shuffled.slice(0, sampleSize), context);
  }
}); 
