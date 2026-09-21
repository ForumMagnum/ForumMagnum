import { viewablePostsSelector } from "@/server/repos/helpers";

export interface AiDigestCuratedPostRow {
  postId: string;
  isRead: boolean;
}

/** Load only the current body; title and byline are already in the candidate metadata. */
export async function loadAiDigestPostBodies(postIds: string[], context: ResolverContext) {
  if (!postIds.length) return [];
  const posts = await context.Posts.find({ _id: { $in: postIds } }, { projection: { _id: 1, contents_latest: 1 } }).fetch();
  const revisionIds = posts.flatMap((post) => post.contents_latest ? [post.contents_latest] : []);
  if (!revisionIds.length) return [];
  const revisions = await context.Revisions.find({ _id: { $in: revisionIds } }, { projection: { _id: 1, html: 1 } }).fetch();
  const revisionsById = new Map(revisions.map((revision) => [revision._id, revision]));
  return posts.flatMap((post) => {
    const html = post.contents_latest ? revisionsById.get(post.contents_latest)?.html : null;
    return html?.trim() ? [{ postId: post._id, revisionHtml: html }] : [];
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
  }, { sort: { curatedDate: -1 }, limit, projection: { _id: 1 } }).fetch();
  if (!posts.length) return [];
  const reads = await context.ReadStatuses.find({
    userId,
    postId: { $in: posts.map((post) => post._id) },
    isRead: true,
  }, { projection: { postId: 1 } }).fetch();
  const readPostIds = new Set(reads.map((read) => read.postId));
  return posts.map((post) => ({ postId: post._id, isRead: readPostIds.has(post._id) }));
}
