import { WrappedYear } from "@/components/ea-forum/wrapped/constants";
import { userIsPostCoauthor } from "@/lib/collections/posts/helpers";
import { userCanEditUser } from "@/lib/collections/users/helpers";
import countBy from "lodash/countBy";
import entries from "lodash/fp/entries";
import sortBy from "lodash/sortBy";
import last from "lodash/fp/last";
import range from "lodash/range";
import sumBy from "lodash/sumBy";
import { Posts } from "@/server/collections/posts/collection.ts";
import Users from "@/server/collections/users/collection";
import ReadStatuses from "@/server/collections/readStatus/collection";
import Tags from "@/server/collections/tags/collection";
import moment from "moment";
import { postStatuses } from "@/lib/collections/posts/constants";
import { Comments } from "@/server/collections/comments/collection.ts";
import { WrappedPersonality } from "./WrappedPersonality";
import { eaEmojiPalette } from "@/lib/voting/eaEmojiPalette";
import { getWrappedEngagement } from "./wrappedEngagment";

/**
 * When making changes here you must also update:
 *  - The backend GraphQL schema in server/resolvers/wrappedResolvers.ts
 *  - The WrappedDataByYear typescript type
 *  - The fragment definition in components/ea-forum/wrapped/hooks.ts
 *
 * UserWrappedDataByYear includes:
 *  - You’re a top X% reader of the EA Forum
 *  - You read X posts this year
 *  - You spend N hours on the EA Forum
 *  - You visited the EA Forum on X days in <year>
 *  - You spent the most time on X topics
 *  - Compared to other users, you spent more time on X core topics
 *  - Your most-read author was Y
 *  - Your top 5 most-read authors are A, B, C, D, E
 *  - You’re in the top X% of Y’s readers (one of your top 5 most-read authors)
 *  - Your highest-karma post in <year> was N (and your next 3 highest-karma
 *     posts are A, B, C)
 *  - You wrote X posts in total this year
 *  - This means you're in the top Y% of post authors
 *  - Your highest-karma comment in <year> was N
 *  - You wrote X comments in total this year
 *  - This means you're in the top Y% of commenters
 *  - Your highest-karma quick take in <year> was N
 *  - You wrote X quick takes in total this year
 *  - This means you're in the top Y% of quick takes authors
 *  - Your overall karma change this year was X (Y from comments, Z from posts)
 *  - Others gave you X [most received react] reacts
 *  - And X reacts in total (X insightful, Y helpful, Z changed my mind)
 */
export const getWrappedDataByYear = async (
  currentUser: DbUser | null,
  userId: string,
  year: WrappedYear,
  repos: Repos,
) => {
  const user = await Users.findOne({_id: userId});

  // Must be logged in and have permission to view this user's data
  if (!userId || !currentUser || !user || !userCanEditUser(currentUser, user)) {
    throw new Error("Not authorized");
  }

  // Get all the user's posts read for the given year
  const start = new Date(year, 0);
  const end = new Date(year + 1, 0);
  const readStatuses = await ReadStatuses.find({
    userId: user._id,
    isRead: true,
    lastUpdated: {$gte: start, $lte: end},
    postId: {$ne: null}
  }).fetch();

  // Filter out the posts that the user themselves authored or co-authored,
  // plus events and shortform posts
  const posts = (
    await Posts.find({
      _id: {$in: readStatuses.map(rs => rs.postId)},
      userId: {$ne: user._id},
      isEvent: false,
      shortform: false,
    }, {}, {
      userId: 1,
      coauthorUserIds: 1,
      tagRelevance: 1,
    }).fetch()
  ).filter((post) => post.userId !== user._id && !userIsPostCoauthor(user, post));

  // Get the top 5 authors that the user has read
  const userIds = posts.flatMap(
    (post) =>[...post.coauthorUserIds, post.userId],
  );
  const authorCounts = countBy(userIds);
  const topAuthors = sortBy(entries(authorCounts), last)
    .slice(-5)
    .map((author) => author![0]) as string[];

  const readAuthorStatsPromise = Promise.all(
    topAuthors.map(async (id) => ({
      authorUserId: id,
      ...(await repos.posts.getReadAuthorStats({
        userId: user._id,
        authorUserId: id,
        year,
      })),
    }))
  );

  // Get the top 15 topics that the user has read (will be filtered down to 4 later)
  const tagIds = posts.flatMap(p => Object.keys(p.tagRelevance ?? {}) ?? []);
  const tagCounts = countBy(tagIds);
  const topTags = sortBy(entries(tagCounts), last).slice(-15).map((tag) => tag![0]);

  // Get the number of posts, comments, and shortforms that the user posted
  // this year, including which were the most popular
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
    agreements,
    discussionsStarted,
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
        isPostType: false, // exclude post type topics like "Announcements"
      },
      { projection: { name: 1, shortName: 1, slug: 1 } }
    ).fetch(),
    Posts.find(
      {
        $or: [{ userId: user._id }, { coauthorUserIds: user._id }],
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
    repos.posts.getAuthorshipStats({ userId: user._id, year }),
    repos.comments.getAuthorshipStats({ userId: user._id, year, shortform: false }),
    repos.comments.getAuthorshipStats({ userId: user._id, year, shortform: true }),
    readAuthorStatsPromise,
    repos.posts.getReadCoreTagStats({ userId: user._id, year }),
    repos.votes.getEAWrappedReactsReceived(userId, start, end),
    repos.votes.getEAWrappedReactsGiven(userId, start, end),
    repos.votes.getEAWrappedAgreements(userId, start, end),
    repos.comments.getEAWrappedDiscussionsStarted(userId, start, end),
  ]);

  const [postKarmaChanges, commentKarmaChanges] = await Promise.all([
    repos.votes.getDocumentKarmaChangePerDay({ documentIds: userPosts.map(({ _id }) => _id), startDate: start, endDate: end }),
    repos.votes.getDocumentKarmaChangePerDay({ documentIds: [...userComments.map(({ _id }) => _id), ...userShortforms.map(({ _id }) => _id)], startDate: start, endDate: end }),
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

  const karmaChanges = await repos.votes.getEAKarmaChanges({
    userId: user._id,
    startDate: start,
    endDate: end,
    af: false,
    showNegative: true,
  });
  const totalKarmaChange = sumBy(
    karmaChanges,
    (doc) => doc.scoreChange,
  );

  const mostReceivedReacts: { name: string, count: number }[] =
    (sortBy(entries(reactsReceived ?? {}), last) as [string, number][])
      .reverse()
      .map(([name, count]) => ({
        name: eaEmojiPalette.find(emoji => emoji.name === name)?.label ?? '',
        count,
      }));

  const {
    engagementPercentile,
    totalSeconds,
    daysVisited,
  }  = await getWrappedEngagement(user._id, year);
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
    .filter((t) => !!t)
    .slice(0, 4);

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
    const topCommentPost = await Posts.findOne({_id: topComment.postId}, {}, {title: 1, slug: 1})
    if (topCommentPost) {
      topComment.postTitle = topCommentPost.title
      topComment.postSlug = topCommentPost.slug
    }
  }

  const personality = new WrappedPersonality({
    reactsReceived,
    reactsGiven,
    agreements,
    engagementPercentile,
    totalKarmaChange,
    postsWritten: postAuthorshipStats.totalCount,
    commentsWritten: commentAuthorshipStats.totalCount,
    topPost: userPosts[0] ?? null,
    topComment,
    discussionsStarted,
  });

  const results: AnyBecauseTodo = {
    engagementPercentile,
    postsReadCount: posts.length,
    totalSeconds,
    daysVisited,
    mostReadTopics,
    relativeMostReadCoreTopics: readCoreTagStats.filter(
      (stat) => stat.readLikelihoodRatio > 0,
    ),
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
}
