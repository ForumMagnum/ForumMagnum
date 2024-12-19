import Users from '../../lib/collections/users/collection';
import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from '../vulcan-lib';
import { userCanEditUser } from "../../lib/collections/users/helpers";
import ReadStatuses from '../../lib/collections/readStatus/collection';
import moment from 'moment';
import Posts from '../../lib/collections/posts/collection';
import countBy from 'lodash/countBy';
import entries from 'lodash/fp/entries';
import sortBy from 'lodash/sortBy';
import last from 'lodash/fp/last';
import range from 'lodash/range';
import sum from 'lodash/sum';
import Tags from '../../lib/collections/tags/collection';
import Comments from '../../lib/collections/comments/collection';
import sumBy from 'lodash/sumBy';
import { getAnalyticsConnection } from "../analytics/postgresConnection";
import { eaEmojiPalette } from '../../lib/voting/eaEmojiPalette';
import { postStatuses } from '../../lib/collections/posts/constants';
import { getConfirmedCoauthorIds, userIsPostCoauthor } from '../../lib/collections/posts/helpers';
import { isWrappedYear } from '@/components/ea-forum/wrapped/hooks';
import type { KarmaChangeBase } from '@/lib/collections/users/karmaChangesGraphQL';

class WrappedPersonality {
  private parts: string[] = [];

  constructor({
    reactsReceived,
    reactsGiven,
    engagementPercentile,
    totalKarmaChange,
    postsWritten,
    commentsWritten,
    topPost,
    topComment,
  }: {
    reactsReceived: Record<string, number>,
    reactsGiven: Record<string, number>,
    engagementPercentile: number,
    totalKarmaChange: number,
    postsWritten: number,
    commentsWritten: number,
    topPost: DbPost | null,
    topComment: DbComment | null,
  }) {
    // Choose the first adjective based on reacts
    const totalReactsReceived = sum(Object.values(reactsReceived));
    const totalReactsGiven = sum(Object.values(reactsReceived));
    if (totalReactsReceived === 0 && totalReactsGiven === 0) {
      this.parts.push("Stoic");
    } else if (totalReactsReceived < totalReactsGiven) {
      switch (last(sortBy(entries(reactsGiven), last))?.[0]) {
        case "love":         this.parts.push("Loving");      break;
        case "helpful":      this.parts.push("Grateful");    break;
        case "insightful":   this.parts.push("Curious");     break;
        case "changed-mind": this.parts.push("Open-Minded"); break;
      }
    } else {
      switch (last(sortBy(entries(reactsReceived), last))?.[0]) {
        case "love":         this.parts.push("Beloved");     break;
        case "helpful":      this.parts.push("Helpful");     break;
        case "insightful":   this.parts.push("Insightful");  break;
        case "changed-mind": this.parts.push("Influential"); break;
      }
    }

    // Choose the second adjective based on engagement
    if (engagementPercentile >= 0.9) {
      this.parts.push("Online");
    } else if (engagementPercentile >= 0.3) {
      this.parts.push("Measured");
    } else {
      this.parts.push("Occasional");
    }

    // Choose the noun
    if (totalKarmaChange >= 1000) {
      this.parts.push("Karma Farmer");
    } else if (
      engagementPercentile >= 0.9 &&
      postsWritten === 0 &&
      commentsWritten < 5
    ) {
      this.parts.push("Lurker");
    } else if (
      totalKarmaChange > 0 &&
      (
        (topPost?.baseScore ?? 0) >= 0.75 * totalKarmaChange ||
        (topComment?.baseScore ?? 0) >= 0.75 * totalKarmaChange
      )
    ) {
      this.parts.push("One-Hit Wonder");
    } else {
      this.parts.push("Forum User");
    }
  }

  toString() {
    return this.parts.join(" ");
  }
}

addGraphQLSchema(`
  type MostReadTopic {
    slug: String,
    name: String,
    shortName: String,
    count: Int
  }
  type TagReadLikelihoodRatio {
    tagId: String,
    tagName: String,
    tagShortName: String,
    userReadCount: Int,
    readLikelihoodRatio: Float
  }
  type MostReadAuthor {
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
  type WrappedDataByYear {
    engagementPercentile: Float,
    postsReadCount: Int,
    totalSeconds: Int,
    daysVisited: [String],
    mostReadTopics: [MostReadTopic],
    relativeMostReadCoreTopics: [TagReadLikelihoodRatio]
    mostReadAuthors: [MostReadAuthor],
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
    personality: String!,
  }
`);

addGraphQLResolvers({
  Query: {
    // UserWrappedDataByYear includes:
    // - You’re a top X% reader of the EA Forum
    // - You read X posts this year
    // - You spend N hours on the EA Forum
    // - You visited the EA Forum on X days in <year>
    // - You spent the most time on X topics
    // - Compared to other users, you spent more time on X core topics
    // - Your most-read author was Y
    // - Your top 5 most-read authors are A, B, C, D, E
    // - You’re in the top X% of Y’s readers (one of your top 5 most-read authors)
    // - Your highest-karma post in <year> was N (and your next 3 highest-karma posts are A, B, C)
    // - You wrote X posts in total this year
    // - This means you're in the top Y% of post authors
    // - Your highest-karma comment in <year> was N
    // - You wrote X comments in total this year
    // - This means you're in the top Y% of commenters
    // - Your highest-karma quick take in <year> was N
    // - You wrote X quick takes in total this year
    // - This means you're in the top Y% of quick takes authors
    // - Your overall karma change this year was X (Y from comments, Z from posts)
    // - Others gave you X [most received react] reacts
    // - And X reacts in total (X insightful, Y helpful, Z changed my mind)
    async UserWrappedDataByYear(_root: void, {userId, year}: {userId: string, year: number}, context: ResolverContext) {
      const { currentUser } = context
      const user = await Users.findOne({_id: userId})

      // Must be logged in and have permission to view this user's data
      if (!userId || !currentUser || !user || !userCanEditUser(currentUser, user)) {
        throw new Error('Not authorized')
      }

      if (!isWrappedYear(year)) {
        throw new Error(`${year} is not a valid wrapped year`)
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
        reactsReceived,
        reactsGiven,
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
        context.repos.votes.getEAWrappedReactsReceived(userId, start, end),
        context.repos.votes.getEAWrappedReactsGiven(userId, start, end),
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
        const day = moment(year, 'YYYY').dayOfYear(i)
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

      const karmaChanges = await context.repos.votes.getEAKarmaChanges({
        userId: user._id,
        startDate: start,
        endDate: end,
        af: false,
        showNegative: true,
      });
      const totalKarmaChange = sumBy(
        karmaChanges,
        (doc: KarmaChangeBase) => doc.scoreChange,
      );

      const mostReceivedReacts: { name: string, count: number }[] =
        (sortBy(entries(reactsReceived ?? {}), last) as [string, number][])
          .reverse()
          .map(([name, count]) => ({
            name: eaEmojiPalette.find(emoji => emoji.name === name)?.label ?? '',
            count,
          }));

      const { engagementPercentile, totalSeconds, daysVisited }  = await getEngagement(user._id, year);
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

      const personality = new WrappedPersonality({
        reactsReceived,
        reactsGiven,
        engagementPercentile,
        totalKarmaChange,
        postsWritten: postAuthorshipStats.totalCount,
        commentsWritten: commentAuthorshipStats.totalCount,
        topPost: userPosts[0] ?? null,
        topComment,
      });

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
        personality: personality.toString(),
      };
      return results;
    },
  },
})

/*
  Note: this just returns the values from a materialized view that never automatically refreshes
  So the code for the materialized view will need to be changed if we do this in future years
*/
async function getEngagement(userId: string, year: number): Promise<{
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
        user_engagement_wrapped
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
    SELECT view_date::text FROM user_engagement_wrapped WHERE view_year = $2 AND user_id = $1 ORDER BY view_date ASC;
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

addGraphQLQuery('UserWrappedDataByYear(userId: String!, year: Int!): WrappedDataByYear')
