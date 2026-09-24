import { viewablePostsSelector } from "@/server/repos/helpers";

export interface AiDigestCuratedPostRow {
  postId: string;
  isRead: boolean;
}

/** Load only the current body; title and byline are already in the candidate metadata. */
export async function loadAiDigestPostBodies(postIds: string[], context: ResolverContext) {
  if (!postIds.length) return [];
  const posts = await context.Posts.find({ _id: { $in: postIds } }, {}, { _id: 1, contents_latest: 1 }).fetch();
  return await loadAiDigestRevisionBodies(posts.flatMap((post) => post.contents_latest
    ? [{ postId: post._id, revisionId: post.contents_latest }]
    : []), context);
}

/** Load immutable revisions for revision-keyed summary and preview caches. */
export async function loadAiDigestRevisionBodies(
  targets: { postId: string; revisionId: string }[], context: ResolverContext,
) {
  if (!targets.length) return [];
  const revisions = await context.Revisions.find(
    { _id: { $in: targets.map((target) => target.revisionId) } },
    {},
    { _id: 1, html: 1 },
  ).fetch();
  const revisionsById = new Map(revisions.map((revision) => [revision._id, revision]));
  return targets.flatMap((target) => {
    const html = revisionsById.get(target.revisionId)?.html;
    return html?.trim() ? [{ postId: target.postId, revisionHtml: html }] : [];
  });
}

export async function loadAiDigestCuratedPostRows(
  userId: string, limit: number, now: Date, context: ResolverContext,
): Promise<AiDigestCuratedPostRow[]> {
  const posts = await context.Posts.find({
    ...viewablePostsSelector,
    deletedDraft: false,
    rejected: false,
    curatedDate: { $ne: null, $lte: now },
  }, { sort: { curatedDate: -1 }, limit }, { _id: 1 }).fetch();
  if (!posts.length) return [];
  const reads = await context.ReadStatuses.find({
    userId,
    postId: { $in: posts.map((post) => post._id) },
    isRead: true,
  }, {}, { postId: 1 }).fetch();
  const readPostIds = new Set(reads.map((read) => read.postId));
  return posts.map((post) => ({ postId: post._id, isRead: readPostIds.has(post._id) }));
}
