import { createWriteStream } from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { createGzip } from "zlib";
import { put, copy, list, del, head } from "@vercel/blob";
import PostsRepo from "./repos/PostsRepo";
import CommentsRepo from "./repos/CommentsRepo";

const DUMP_PATHNAME_PREFIX = "public-dumps/";
const LATEST_DUMP_PATHNAME = `${DUMP_PATHNAME_PREFIX}lesswrong-public-dump-latest.ndjson.gz`;
const MANIFEST_PATHNAME = `${DUMP_PATHNAME_PREFIX}manifest.json`;
const POSTS_BATCH_SIZE = 400;
const COMMENTS_BATCH_SIZE = 2000;
const DUMP_RETENTION_DAYS = 30;

export interface PublicDataDumpOptions {
  /** Write the gzipped dump to a local file instead of Vercel Blob (for testing via `yarn repl`) */
  outfile?: string,
  /** Cap on exported posts (for testing) */
  postLimit?: number,
  /** Cap on exported comments (for testing) */
  commentLimit?: number,
}

export interface PublicDataDumpStats {
  posts: number,
  comments: number,
  uncompressedBytes: number,
  compressedBytes: number | null,
  url: string | null,
}

/**
 * Yields the dump as NDJSON lines: one meta line, then one line per public
 * post, then one line per public comment. Which documents count as public is
 * decided by the SQL in {@link PostsRepo.getPublicPostsForDump} and
 * {@link CommentsRepo.getPublicCommentsForDump}; only the fields those
 * queries select are exported, so nothing non-public (vote data, emails, IPs,
 * drafts) is ever serialized here.
 */
async function* generateDumpLines(
  options: PublicDataDumpOptions,
  stats: PublicDataDumpStats,
): AsyncGenerator<string> {
  const postsRepo = new PostsRepo();
  const commentsRepo = new CommentsRepo();

  const metaLine = JSON.stringify({
    type: "meta",
    format: 1,
    site: "https://www.lesswrong.com",
    generatedAt: new Date().toISOString(),
    license: "Content is owned by its authors; see each author's profile and lesswrong.com's terms of use.",
  }) + "\n";
  stats.uncompressedBytes += metaLine.length;
  yield metaLine;

  let afterPostId = "";
  for (;;) {
    const batch = await postsRepo.getPublicPostsForDump(afterPostId, POSTS_BATCH_SIZE);
    if (!batch.length) break;
    for (const row of batch) {
      const line = JSON.stringify({ type: "post", ...row }) + "\n";
      stats.posts++;
      stats.uncompressedBytes += line.length;
      yield line;
    }
    afterPostId = batch[batch.length - 1]._id;
    if (options.postLimit && stats.posts >= options.postLimit) break;
  }

  let afterCommentId = "";
  for (;;) {
    const batch = await commentsRepo.getPublicCommentsForDump(afterCommentId, COMMENTS_BATCH_SIZE);
    if (!batch.length) break;
    for (const row of batch) {
      const line = JSON.stringify({ type: "comment", ...row }) + "\n";
      stats.comments++;
      stats.uncompressedBytes += line.length;
      yield line;
    }
    afterCommentId = batch[batch.length - 1]._id;
    if (options.commentLimit && stats.comments >= options.commentLimit) break;
  }
}

/**
 * Delete dated dumps older than the retention window. The latest-alias and
 * manifest blobs are overwritten in place each run and are never pruned.
 */
async function pruneOldDumps(): Promise<void> {
  const cutoff = Date.now() - DUMP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const { blobs } = await list({ prefix: DUMP_PATHNAME_PREFIX, limit: 1000 });
  const stale = blobs.filter(blob =>
    blob.pathname !== LATEST_DUMP_PATHNAME &&
    blob.pathname !== MANIFEST_PATHNAME &&
    new Date(blob.uploadedAt).getTime() < cutoff
  );
  if (stale.length) {
    await del(stale.map(blob => blob.url));
  }
}

/**
 * Generate the daily public data dump — every publicly-visible post and
 * comment, serialized as gzipped NDJSON — and upload it to Vercel Blob as a
 * dated file plus a stable "latest" alias and a small JSON manifest.
 *
 * Runs from the public-data-dump cron route. Requires a Vercel Blob store to
 * be connected to the project (BLOB_READ_WRITE_TOKEN).
 */
export async function generatePublicDataDump(options: PublicDataDumpOptions = {}): Promise<PublicDataDumpStats> {
  const stats: PublicDataDumpStats = {
    posts: 0,
    comments: 0,
    uncompressedBytes: 0,
    compressedBytes: null,
    url: null,
  };

  const source = Readable.from(generateDumpLines(options, stats));
  const gzip = createGzip({ level: 6 });

  if (options.outfile) {
    await pipeline(source, gzip, createWriteStream(options.outfile));
    return stats;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set; connect a Vercel Blob store to the project before running the public data dump");
  }

  const dateString = new Date().toISOString().slice(0, 10);
  const datedPathname = `${DUMP_PATHNAME_PREFIX}lesswrong-public-dump-${dateString}.ndjson.gz`;
  const uploadPromise = put(datedPathname, gzip, {
    access: "public",
    contentType: "application/gzip",
    addRandomSuffix: false,
    allowOverwrite: true,
    multipart: true,
  });

  let datedBlobUrl: string;
  try {
    const [, uploadResult] = await Promise.all([pipeline(source, gzip), uploadPromise]);
    datedBlobUrl = uploadResult.url;
  } catch (e) {
    source.destroy();
    gzip.destroy();
    throw e;
  }

  const [latestBlob, datedBlobDetails] = await Promise.all([
    copy(datedBlobUrl, LATEST_DUMP_PATHNAME, {
      access: "public",
      contentType: "application/gzip",
      addRandomSuffix: false,
      allowOverwrite: true,
    }),
    head(datedBlobUrl),
  ]);
  stats.url = latestBlob.url;
  stats.compressedBytes = datedBlobDetails.size;

  await put(MANIFEST_PATHNAME, JSON.stringify({
    generatedAt: new Date().toISOString(),
    latestUrl: latestBlob.url,
    datedUrl: datedBlobUrl,
    posts: stats.posts,
    comments: stats.comments,
    uncompressedBytes: stats.uncompressedBytes,
    compressedBytes: stats.compressedBytes,
  }, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  await pruneOldDumps();

  return stats;
}
