/*
 * Scripts for selecting, creating, inspecting, and repairing ReviewWinner records.
 *
 * All exports in this file are intended to be run via `yarn repl`, e.g.:
 *   yarn repl prod packages/lesswrong/server/scripts/reviewWinnerCreation.ts 'checkReviewWinners()'
 *   yarn repl prod packages/lesswrong/server/scripts/reviewWinnerCreation.ts 'createReviewWinners()'
 *   yarn repl prod packages/lesswrong/server/scripts/reviewWinnerCreation.ts 'createReviewWinnerFromId("postId", 0, "rationality")'
 *   yarn repl prod packages/lesswrong/server/scripts/reviewWinnerCreation.ts 'updateReviewWinnerRankings(2024)'
 */

import { Posts } from '@/server/collections/posts/collection';
import { Tags } from "@/server/collections/tags/collection";
import { createAdminContext } from "@/server/vulcan-lib/createContexts";
import { createReviewWinner as createReviewWinnerMutator } from "@/server/collections/reviewWinners/mutations";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { REVIEW_YEAR, ReviewWinnerCategory } from "@/lib/reviewUtils";
import moment from "moment";

// ── Category assignment ──────────────────────────────────────────────

// This fetches the tags used to assign posts to a ReviewWinnerCategory, which
// almost-but-not-exactly map to Core Tags.
async function fetchCategoryAssignmentTags() {
  const [coreTags, aiStrategyTags] = await Promise.all([
    Tags.find({core: true, name: {$in: ["Rationality", "World Modeling", "World Optimization", "Practical", "AI"]}}).fetch(),
    Tags.find({name: {$in: ["AI Governance", "AI Timelines", "AI Takeoff", "AI Risk", "AI Alignment Fieldbuilding"]}}).fetch()
  ]);
  return {coreTags, aiStrategyTags};
}

const tagToCategory: Record<string, ReviewWinnerCategory> = {
  "Rationality": "rationality",
  "World Modeling": "modeling",
  "World Optimization": "optimization",
  "Practical": "practical"
};

// ReviewWinnerCategories don't include "Community", and split AI into two major categories:
// Technical AI Safety ("ai safety") and AI Strategy. This function uses some heuristics to
// guess which category a post belongs to.
function getPostCategory(post: DbPost, coreTags: DbTag[], aiStrategyTags: DbTag[]): ReviewWinnerCategory {
  const tagRelevance = post.tagRelevance;
  const coreTagsOnPost = coreTags.filter(tag => tagRelevance[tag._id] > 0);
  const postHasAIStrategyTag = aiStrategyTags.some(tag => tagRelevance[tag._id] > 0);
  const mostRelevantCoreTag = coreTagsOnPost.sort((a, b) => tagRelevance[b._id] - tagRelevance[a._id])[0];
  if (mostRelevantCoreTag?.name === "AI") {
    return postHasAIStrategyTag ? "ai strategy" : "ai safety";
  } else {
    return tagToCategory[mostRelevantCoreTag?.name];
  }
}

// ── Post selection ───────────────────────────────────────────────────

async function getReviewWinnerPosts() {
  return await Posts.find({
    postedAt: {
      $gte: moment(`${REVIEW_YEAR}-01-01`).toDate(),
      $lt: moment(`${REVIEW_YEAR + 1}-01-01`).toDate()
    },
    finalReviewVoteScoreAllKarma: {$gte: 1},
    reviewCount: {$gte: 1},
    positiveReviewVoteCount: {$gte: 1}
  }, {sort: {finalReviewVoteScoreHighKarma: -1}, limit: 50}).fetch();
}

// ── Creation helpers ─────────────────────────────────────────────────

async function createReviewWinner(post: DbPost, idx: number, category: ReviewWinnerCategory, adminContext: ResolverContext) {
  return createReviewWinnerMutator({
    data: {
      postId: post._id,
      reviewYear: REVIEW_YEAR,
      reviewRanking: idx,
      category,
    },
  }, adminContext);
}

// ── Exported repl commands ───────────────────────────────────────────

/**
 * Dry-run: prints the top posts with their auto-assigned categories in a
 * formatted table. Use this to sanity-check category assignments before
 * running `createReviewWinners`.
 */

const categoryColors: Record<string, string> = {
  "rationality":   "\x1b[36m",  // cyan
  "modeling":      "\x1b[34m",  // blue
  "optimization":  "\x1b[32m",  // green
  "ai strategy":   "\x1b[33m",  // yellow
  "ai safety":     "\x1b[31m",  // red
  "practical":     "\x1b[35m",  // magenta
};
const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

export const checkReviewWinners = async () => {
  const posts = await getReviewWinnerPosts();
  const {coreTags, aiStrategyTags} = await fetchCategoryAssignmentTags();

  // eslint-disable-next-line no-console
  console.log(`\n${DIM}${"#".padStart(3)}  ${"Score".padStart(7)}  ${"Category".padEnd(14)}  ${"Title".padEnd(52)}  Link${RESET}`);
  // eslint-disable-next-line no-console
  console.log(`${DIM}${"─".repeat(88)}${RESET}`);

  posts.forEach((post, idx) => {
    const category = getPostCategory(post, coreTags, aiStrategyTags);
    const color = categoryColors[category] ?? "";
    const rank = String(idx + 1).padStart(3);
    const score = post.finalReviewVoteScoreHighKarma.toFixed(1).padStart(7);
    const cat = (category ?? "unknown").padEnd(14);
    const title = (post.title.length > 50 ? post.title.slice(0, 47) + "..." : post.title).padEnd(52);
    const url = `https://www.lesswrong.com${postGetPageUrl(post)}`;
    // OSC 8 hyperlink: \x1b]8;;URL\x1b\\LABEL\x1b]8;;\x1b\\
    const link = `\x1b]8;;${url}\x1b\\link\x1b]8;;\x1b\\`;

    // eslint-disable-next-line no-console
    console.log(`${rank}  ${score}  ${color}${cat}${RESET}  ${title}  ${link}`);
  });

  // eslint-disable-next-line no-console
  console.log(`${DIM}${"─".repeat(88)}${RESET}\n`);
};

/**
 * Creates ReviewWinner records for the top posts of `REVIEW_YEAR`.
 * The postId index is unique, so this will error if run twice for the same year
 * without first deleting existing records.
 */
export const createReviewWinners = async () => {
  const posts = await getReviewWinnerPosts();
  const {coreTags, aiStrategyTags} = await fetchCategoryAssignmentTags();
  const adminContext = createAdminContext();

  await Promise.all(posts.map((post, idx) => {
    const category = getPostCategory(post, coreTags, aiStrategyTags);
    return createReviewWinner(post, idx, category, adminContext);
  }));
};

/**
 * Creates a single ReviewWinner for a specific post. Useful for manually
 * fixing category assignments or adding posts that were missed.
 */
export const createReviewWinnerFromId = async (postId: string, idx: number, category: ReviewWinnerCategory) => {
  const post = await Posts.findOne({_id: postId});
  if (!post) {
    throw new Error(`Post not found: ${postId}`);
  }
  const adminContext = createAdminContext();
  return createReviewWinner(post, idx, category, adminContext);
};

/**
 * Re-sorts ReviewWinner rankings by vote score for a given year.
 *
 * Useful if you've removed a post from the list and need to close the gap.
 * Uses a two-pass approach (temp rankings, then real rankings) to avoid
 * uniqueness constraint violations.
 */
export const updateReviewWinnerRankings = async (year: number) => {
  const context = createAdminContext();
  const { ReviewWinners } = context;
  const reviewWinners = await ReviewWinners.find({reviewYear: year}).fetch();
  const postIds = reviewWinners.map(winner => winner.postId);
  const posts = await Posts.find({ _id: { $in: postIds } }).fetch();

  const postsById = Object.fromEntries(posts.map(post => [post._id, post]));

  const sortedWinners = [...reviewWinners].sort((a, b) => {
    const scoreA = postsById[a.postId]?.finalReviewVoteScoreHighKarma ?? 0;
    const scoreB = postsById[b.postId]?.finalReviewVoteScoreHighKarma ?? 0;
    return scoreB - scoreA;
  });

  // Set temporary rankings first to avoid uniqueness constraint violations
  const tempRankStart = -10000;
  await Promise.all(
    sortedWinners.map((winner, i) =>
      ReviewWinners.rawUpdateOne(
        {_id: winner._id},
        {$set: {reviewRanking: tempRankStart - i}}
      )
    )
  );

  await Promise.all(
    sortedWinners.map((winner, i) => ReviewWinners.rawUpdateOne(
      {_id: winner._id},
      {$set: {reviewRanking: i}}
    ))
  );
};
