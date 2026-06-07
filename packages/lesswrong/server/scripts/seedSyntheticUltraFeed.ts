import moment from "moment";
import Users from "@/server/collections/users/collection";
import { Posts } from "@/server/collections/posts/collection";
import { Comments } from "@/server/collections/comments/collection";
import { Subscriptions } from "@/server/collections/subscriptions/collection";
import BookmarksRepo from "@/server/repos/BookmarksRepo";
import { createSubscription } from "@/server/collections/subscriptions/mutations";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";
import {
  createDummyPost,
  createDummyUser,
} from "@/integrationTests/utils";
import { postStatuses } from "@/lib/collections/posts/constants";
import { randomId } from "@/lib/random";

/**
 * Dev data for testing UltraFeed and profile-feed rendering on an otherwise
 * sparse local database.
 *
 * Run with:
 *   yarn repl dev lw packages/lesswrong/server/scripts/seedSyntheticUltraFeed.ts 'seedSyntheticUltraFeed()'
 */

interface SyntheticUserDefinition {
  username: string;
  displayName: string;
  karma: number;
}

interface SyntheticCommentDefinition {
  authorUsername: string;
  body: string;
  baseScore: number;
  postedAtHoursAgo: number;
}

interface SyntheticPostDefinition {
  title: string;
  authorUsername: string;
  coauthorUsernames: string[];
  body: string;
  baseScore: number;
  postedAtHoursAgo: number;
  frontpage: boolean;
  curated: boolean;
  comments: SyntheticCommentDefinition[];
}

interface SyntheticUltraFeedScenario {
  viewer: SyntheticUserDefinition;
  authors: SyntheticUserDefinition[];
  posts: SyntheticPostDefinition[];
  bookmarkedPostTitles: string[];
}

interface SeededSyntheticUltraFeedSummary {
  viewer: Pick<DbUser, "_id" | "username" | "slug" | "displayName">;
  authors: Array<Pick<DbUser, "_id" | "username" | "slug" | "displayName">>;
  posts: Array<Pick<DbPost, "_id" | "title" | "slug">>;
}

const htmlParagraph = (text: string) => `<p>${text}</p>`;

export function getSyntheticUltraFeedScenario(): SyntheticUltraFeedScenario {
  const viewer = {
    username: "ultrafeed_tester",
    displayName: "UltraFeed Tester",
    karma: 500,
  };

  const authors = [
    {
      username: "uf_primary_author",
      displayName: "UltraFeed Primary Author",
      karma: 250,
    },
    {
      username: "uf_long_coauthor_one",
      displayName: "Senthooran Rajamanoharan With A Very Long Synthetic Name",
      karma: 120,
    },
    {
      username: "uf_long_coauthor_two",
      displayName: "Aryaj Long-Coauthor Regression Fixture",
      karma: 90,
    },
    {
      username: "uf_commenter",
      displayName: "UltraFeed Frequent Commenter",
      karma: 80,
    },
  ];

  const posts = [
    {
      title: "Synthetic UltraFeed: long coauthors and metadata",
      authorUsername: "uf_primary_author",
      coauthorUsernames: ["uf_long_coauthor_one", "uf_long_coauthor_two"],
      body: htmlParagraph(
        "This synthetic post has multiple coauthors with long display names so UltraFeed author-row ellipsization can be checked without production data."
      ),
      baseScore: 81,
      postedAtHoursAgo: 3,
      frontpage: true,
      curated: false,
      comments: [
        {
          authorUsername: "uf_commenter",
          body: "A high-karma synthetic comment to exercise UltraFeed comment-thread cards.",
          baseScore: 18,
          postedAtHoursAgo: 2,
        },
        {
          authorUsername: "uf_long_coauthor_one",
          body: "A coauthor reply with enough karma to remain visible in thread tests.",
          baseScore: 9,
          postedAtHoursAgo: 1,
        },
      ],
    },
    {
      title: "Synthetic UltraFeed: subscribed author latest post",
      authorUsername: "uf_commenter",
      coauthorUsernames: [],
      body: htmlParagraph(
        "This recent subscribed-author post should appear through the latest/subscriptions UltraFeed path."
      ),
      baseScore: 35,
      postedAtHoursAgo: 8,
      frontpage: true,
      curated: true,
      comments: [
        {
          authorUsername: "uf_primary_author",
          body: "A recent reply for comment-thread and profile feed rendering.",
          baseScore: 12,
          postedAtHoursAgo: 4,
        },
      ],
    },
    {
      title: "Synthetic UltraFeed: lower-score comparison item",
      authorUsername: "uf_long_coauthor_two",
      coauthorUsernames: [],
      body: htmlParagraph(
        "This item gives local feeds a lower-score comparison card while still clearing the UltraFeed baseScore threshold."
      ),
      baseScore: 7,
      postedAtHoursAgo: 24,
      frontpage: false,
      curated: false,
      comments: [
        {
          authorUsername: "uf_commenter",
          body: "A modest-score comment that should still be available for profile and thread fixtures.",
          baseScore: 4,
          postedAtHoursAgo: 6,
        },
      ],
    },
  ];

  return {
    viewer,
    authors,
    posts,
    bookmarkedPostTitles: [
      "Synthetic UltraFeed: long coauthors and metadata",
      "Synthetic UltraFeed: subscribed author latest post",
    ],
  };
}

function userLogFields(user: DbUser): Pick<DbUser, "_id" | "username" | "slug" | "displayName"> {
  return {
    _id: user._id,
    username: user.username,
    slug: user.slug,
    displayName: user.displayName,
  };
}

function postLogFields(post: DbPost): Pick<DbPost, "_id" | "title" | "slug"> {
  return {
    _id: post._id,
    title: post.title,
    slug: post.slug,
  };
}

function getSyntheticUsername(user: DbUser): string {
  if (!user.username) {
    throw new Error(`Synthetic user ${user._id} is missing a username`);
  }
  return user.username;
}

async function getOrCreateSyntheticUser(definition: SyntheticUserDefinition): Promise<DbUser> {
  const existing = await Users.findOne({ username: definition.username });
  if (existing) {
    await Users.rawUpdateOne({ _id: existing._id }, {
      $set: {
        displayName: definition.displayName,
        karma: definition.karma,
        acceptedTos: true,
      },
    });
    const updated = await Users.findOne({ _id: existing._id });
    if (!updated) {
      throw new Error(`Could not reload synthetic user ${definition.username}`);
    }
    return updated;
  }

  return await createDummyUser({
    username: definition.username,
    displayName: definition.displayName,
    karma: definition.karma,
    acceptedTos: true,
  });
}

function getPostDates(definition: SyntheticPostDefinition) {
  const postedAt = moment().subtract(definition.postedAtHoursAgo, "hours").toDate();
  return {
    postedAt,
    createdAt: postedAt,
    frontpageDate: definition.frontpage ? postedAt : null,
    curatedDate: definition.curated ? postedAt : null,
  };
}

async function ensurePostFields(post: DbPost, definition: SyntheticPostDefinition, coauthors: DbUser[]) {
  await Posts.rawUpdateOne({ _id: post._id }, {
    $set: {
      ...getPostDates(definition),
      coauthorUserIds: coauthors.map(coauthor => coauthor._id),
      baseScore: definition.baseScore,
      score: definition.baseScore,
      voteCount: Math.max(1, Math.round(definition.baseScore / 2)),
      status: postStatuses.STATUS_APPROVED,
      draft: false,
      rejected: false,
      shortform: false,
      isEvent: false,
    },
  });
}

async function getOrCreateSyntheticPost(
  definition: SyntheticPostDefinition,
  usersByUsername: Map<string, DbUser>
): Promise<DbPost> {
  const author = usersByUsername.get(definition.authorUsername);
  if (!author) {
    throw new Error(`Missing synthetic author ${definition.authorUsername}`);
  }

  const coauthors = definition.coauthorUsernames.map(username => {
    const coauthor = usersByUsername.get(username);
    if (!coauthor) {
      throw new Error(`Missing synthetic coauthor ${username}`);
    }
    return coauthor;
  });

  const existing = await Posts.findOne({ title: definition.title });
  if (existing) {
    await ensurePostFields(existing, definition, coauthors);
    const updated = await Posts.findOne({ _id: existing._id });
    if (!updated) {
      throw new Error(`Could not reload synthetic post ${definition.title}`);
    }
    return updated;
  }

  const created = await createDummyPost(author, {
    title: definition.title,
    contents: {
      originalContents: {
        type: "html",
        data: definition.body,
        yjsState: null,
      },
    },
    coauthorUserIds: coauthors.map(coauthor => coauthor._id),
    ...getPostDates(definition),
    status: postStatuses.STATUS_APPROVED,
    draft: false,
  });
  await ensurePostFields(created, definition, coauthors);
  const updated = await Posts.findOne({ _id: created._id });
  if (!updated) {
    throw new Error(`Could not reload synthetic post ${definition.title}`);
  }
  return updated;
}

function getCommentPostedAt(definition: SyntheticCommentDefinition) {
  return moment().subtract(definition.postedAtHoursAgo, "hours").toDate();
}

function getCommentContents(
  definition: SyntheticCommentDefinition,
  author: DbUser,
  editedAt: Date
): EditableFieldContents {
  const words = definition.body.trim().split(/\s+/).filter(Boolean);
  return {
    originalContents: {
      type: "markdown",
      data: definition.body,
      yjsState: null,
    },
    html: htmlParagraph(definition.body),
    wordCount: words.length,
    editedAt,
    userId: author._id,
    version: "1.0.0",
  };
}

async function ensureComment(
  post: DbPost,
  definition: SyntheticCommentDefinition,
  usersByUsername: Map<string, DbUser>
) {
  const author = usersByUsername.get(definition.authorUsername);
  if (!author) {
    throw new Error(`Missing synthetic comment author ${definition.authorUsername}`);
  }

  const existing = (await Comments.find({
    postId: post._id,
    userId: author._id,
  }).fetch()).find(comment => comment.contents?.originalContents?.data === definition.body);
  if (existing) {
    const postedAt = getCommentPostedAt(definition);
    await Comments.rawUpdateOne({ _id: existing._id }, {
      $set: {
        contents: getCommentContents(definition, author, postedAt),
        baseScore: definition.baseScore,
        score: definition.baseScore,
        voteCount: Math.max(1, Math.round(definition.baseScore / 2)),
        postedAt,
        lastEditedAt: postedAt,
        lastSubthreadActivity: postedAt,
        draft: false,
        deleted: false,
        deletedPublic: false,
        rejected: false,
      },
    });
    return;
  }

  const commentId = randomId();
  const postedAt = getCommentPostedAt(definition);
  const commentData: Omit<DbComment, "__collectionName"> = {
    _id: commentId,
    schemaVersion: 1,
    createdAt: postedAt,
    legacyData: null,
    af: false,
    afBaseScore: null,
    afDate: null,
    afExtendedScore: null,
    afVoteCount: null,
    agentFoundationsId: null,
    answer: false,
    author: null,
    authorIsUnreviewed: false,
    baseScore: definition.baseScore,
    contents: getCommentContents(definition, author, postedAt),
    contents_latest: null,
    debateResponse: null,
    deleted: false,
    deletedByUserId: null,
    deletedDate: null,
    deletedPublic: false,
    deletedReason: null,
    descendentCount: 0,
    directChildrenCount: 0,
    draft: false,
    extendedScore: null,
    hideAuthor: false,
    hideKarma: null,
    hideModeratorHat: null,
    inactive: false,
    isPinnedOnProfile: false,
    lastEditedAt: postedAt,
    lastSubthreadActivity: postedAt,
    legacy: false,
    legacyId: null,
    legacyParentId: null,
    legacyPoll: false,
    moderatorHat: false,
    moveToAlignmentUserId: null,
    needsReview: false,
    nominatedForReview: null,
    originalDialogueId: null,
    parentAnswerId: null,
    parentCommentId: null,
    pingbacks: null,
    postId: post._id,
    postVersion: null,
    postedAt,
    promoted: false,
    promotedAt: null,
    promotedByUserId: null,
    referrer: null,
    rejected: false,
    rejectedByUserId: null,
    rejectedReason: null,
    relevantTagIds: [],
    repliesBlockedUntil: null,
    retracted: false,
    reviewForAlignmentUserId: null,
    reviewedByUserId: null,
    reviewingForReview: null,
    score: definition.baseScore,
    shortform: false,
    shortformFrontpage: false,
    spam: false,
    suggestForAlignmentUserIds: [],
    tagCommentType: "DISCUSSION",
    tagId: null,
    title: null,
    topLevelCommentId: null,
    userAgent: null,
    userIP: null,
    userId: author._id,
    voteCount: Math.max(1, Math.round(definition.baseScore / 2)),
  };

  await Comments.rawInsert(commentData);
}

async function updatePostCommentMetadata(post: DbPost) {
  const comments = await Comments.find({
    postId: post._id,
    draft: { $ne: true },
    deleted: { $ne: true },
    deletedPublic: { $ne: true },
    rejected: { $ne: true },
  }).fetch();
  const newestComment = comments.reduce<Date | null>((latest, comment) => {
    if (!comment.postedAt) return latest;
    if (!latest || comment.postedAt > latest) return comment.postedAt;
    return latest;
  }, null);

  await Posts.rawUpdateOne({ _id: post._id }, {
    $set: {
      commentCount: comments.length,
      lastCommentedAt: newestComment ?? post.postedAt,
    },
  });
}

async function subscribeViewerToAuthors(viewer: DbUser, authors: DbUser[]) {
  const context = await computeContextFromUser({ user: viewer, isSSR: false });
  for (const author of authors) {
    const existing = await Subscriptions.findOne({
      userId: viewer._id,
      documentId: author._id,
      collectionName: "Users",
      type: "newPosts",
    });
    if (existing) {
      await Subscriptions.rawUpdateOne({ _id: existing._id }, {
        $set: {
          state: "subscribed",
          deleted: false,
        },
      });
      continue;
    }

    await createSubscription({
      data: {
        state: "subscribed",
        documentId: author._id,
        collectionName: "Users",
        type: "newPosts",
      },
    }, context);
  }
}

async function bookmarkPostsForViewer(viewer: DbUser, posts: DbPost[], scenario: SyntheticUltraFeedScenario) {
  const bookmarksRepo = new BookmarksRepo();
  const postsByTitle = new Map(posts.map(post => [post.title, post]));
  for (const title of scenario.bookmarkedPostTitles) {
    const post = postsByTitle.get(title);
    if (!post) {
      throw new Error(`Missing synthetic bookmark target ${title}`);
    }
    await bookmarksRepo.setBookmarkActive(viewer._id, post._id, "Posts", true);
  }
  await bookmarksRepo.updateBookmarkCountForUser(viewer._id);
}

export async function seedSyntheticUltraFeed(): Promise<SeededSyntheticUltraFeedSummary> {
  const scenario = getSyntheticUltraFeedScenario();
  const viewer = await getOrCreateSyntheticUser(scenario.viewer);
  const authors = await Promise.all(scenario.authors.map(getOrCreateSyntheticUser));
  const usersByUsername = new Map([viewer, ...authors].map(user => [getSyntheticUsername(user), user]));

  const posts: DbPost[] = [];
  for (const postDefinition of scenario.posts) {
    const post = await getOrCreateSyntheticPost(postDefinition, usersByUsername);
    posts.push(post);
    for (const commentDefinition of postDefinition.comments) {
      await ensureComment(post, commentDefinition, usersByUsername);
    }
    await updatePostCommentMetadata(post);
  }

  await subscribeViewerToAuthors(viewer, authors);
  await bookmarkPostsForViewer(viewer, posts, scenario);

  const summary = {
    viewer: userLogFields(viewer),
    authors: authors.map(userLogFields),
    posts: posts.map(postLogFields),
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    ...summary,
    viewerProfilePath: `/users/${viewer.slug}`,
    ultraFeedPath: `/feed`,
  }, null, 2));

  return summary;
}

export default seedSyntheticUltraFeed;
