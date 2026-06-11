import "./replCssStub";
import fs from "fs";
import * as Y from "yjs";
import Posts from "@/server/collections/posts/collection";
import YjsDocuments from "@/server/collections/yjsDocuments/collection";
import { getAnalyticsConnection } from "@/server/analytics/postgresConnection";
import { HARNESS_DATA_DIR, RECOVERED_QUOTES_FILE, type RecoveredQuote } from "./harnessShared";

const COMMENTS_DOC_SUFFIX = "/comments";

/**
 * Load the authoritative historical outcome for every commentOnDraft call
 * that recorded a threadId, keyed by threadId. Returns an empty map when no
 * analytics DB is configured.
 */
async function loadAnalyticsResultsByThreadId(): Promise<Map<string, string>> {
  const analyticsDb = getAnalyticsConnection();
  const resultByThreadId = new Map<string, string>();
  if (!analyticsDb) {
    // eslint-disable-next-line no-console
    console.warn("No analytics DB configured; recovered quotes will have analyticsResult=null");
    return resultByThreadId;
  }
  const rows: Array<{ threadId: string, operationResult: string | null }> = await analyticsDb.any(`
    -- quoteMatchHarness.loadAnalyticsResultsByThreadId
    SELECT event->>'threadId' AS "threadId", event->>'operationResult' AS "operationResult"
    FROM raw
    WHERE environment = ANY($(environments))
      AND event_type = 'agentApiCall'
      AND event->>'route' = 'commentOnDraft'
      AND event->>'threadId' IS NOT NULL
      AND timestamp > NOW() - INTERVAL '2 years'
  `, {
    // Cover both naming shapes across dev/prod analytics environments.
    environments: ["development", "lesswrong.com", "development.lesswrong.com", "localhost"],
  });
  for (const row of rows) {
    if (row.operationResult) {
      resultByThreadId.set(row.threadId, row.operationResult);
    }
  }
  return resultByThreadId;
}

/**
 * Recover real agent-supplied quotes from commentOnDraft threads. Every
 * thread persists its quote in the post's comments Yjs document; the
 * matching analytics event (joined by threadId) records whether the original
 * call attached it, and a byte-search of the current main-doc state records
 * whether the mark still exists today.
 *
 * Restricted to posts that are currently published, matching the corpus
 * policy. The quotes are comment-thread content (sensitive even on published
 * posts): only counts are printed; the quotes themselves go to a gitignored
 * JSONL file.
 *
 * Run via: yarn repl dev lw packages/lesswrong/server/scripts/quoteMatchHarness/recoverCommentQuotes.ts "recoverCommentOnDraftQuotes()"
 */
export async function recoverCommentOnDraftQuotes(): Promise<void> {
  const resultByThreadId = await loadAnalyticsResultsByThreadId();

  const yjsRows = await YjsDocuments.find(
    { collectionName: "Posts" },
    {},
    { documentId: 1 },
  ).fetch();
  const commentDocRows = yjsRows.filter((row) => row.documentId.endsWith(COMMENTS_DOC_SUFFIX));
  const postIds = commentDocRows.map((row) => row.documentId.slice(0, -COMMENTS_DOC_SUFFIX.length));

  const publishedPosts = await Posts.find(
    { _id: { $in: postIds }, draft: false, deletedDraft: { $ne: true }, rejected: { $ne: true } },
    {},
    { _id: 1 },
  ).fetch();
  const publishedIds = new Set(publishedPosts.map((post) => post._id));

  const recovered: RecoveredQuote[] = [];
  let scannedDocs = 0;
  let withAnalyticsResult = 0;

  for (const row of commentDocRows) {
    const postId = row.documentId.slice(0, -COMMENTS_DOC_SUFFIX.length);
    if (!publishedIds.has(postId)) continue;

    const commentsRow = await YjsDocuments.findOne({ collectionName: "Posts", documentId: row.documentId });
    if (!commentsRow?.yjsState) continue;
    scannedDocs++;

    const ydoc = new Y.Doc();
    try {
      Y.applyUpdate(ydoc, new Uint8Array(commentsRow.yjsState));

      const threads: Array<{ threadId: string, quote: string, commentTimeStamp: number | null }> = [];
      const commentsArray = ydoc.get("comments", Y.Array<unknown>);
      for (let i = 0; i < commentsArray.length; i++) {
        const entry = commentsArray.get(i);
        if (!(entry instanceof Y.Map)) continue;
        if (entry.get("type") !== "thread") continue;
        // commentOnDraft threads only; suggestion threads' "quotes" are
        // produced by the suggestion pipeline, not by agent quoting.
        if (entry.get("threadType") !== "comment") continue;
        const threadId = entry.get("id");
        const quote = entry.get("quote");
        if (typeof threadId !== "string" || typeof quote !== "string" || !quote.trim()) continue;
        const comments = entry.get("comments");
        const firstComment = comments instanceof Y.Array && comments.length > 0 ? comments.get(0) : null;
        const timeStamp = firstComment instanceof Y.Map ? firstComment.get("timeStamp") : null;
        threads.push({
          threadId,
          quote,
          commentTimeStamp: typeof timeStamp === "number" ? timeStamp : null,
        });
      }
      if (threads.length === 0) continue;

      const mainRow = await YjsDocuments.findOne({ collectionName: "Posts", documentId: postId });
      const mainState = mainRow?.yjsState ? Buffer.from(mainRow.yjsState) : null;

      for (const { threadId, quote, commentTimeStamp } of threads) {
        const analyticsResult = resultByThreadId.get(threadId) ?? null;
        if (analyticsResult) withAnalyticsResult++;
        recovered.push({
          postId,
          threadId,
          quote,
          commentTimeStamp,
          analyticsResult,
          markPresentInCurrentDoc: mainState !== null && mainState.includes(threadId),
        });
      }
    } finally {
      ydoc.destroy();
    }
  }

  fs.mkdirSync(HARNESS_DATA_DIR, { recursive: true });
  fs.writeFileSync(
    RECOVERED_QUOTES_FILE,
    recovered.map((entry) => JSON.stringify(entry)).join("\n") + (recovered.length > 0 ? "\n" : ""),
  );

  const attachedByAnalytics = recovered
    .filter((entry) => entry.analyticsResult === "attached_by_quote_match").length;
  const noMatchByAnalytics = recovered
    .filter((entry) => entry.analyticsResult === "top_level_no_match").length;
  // eslint-disable-next-line no-console
  console.log(
    `Recovered commentOnDraft quotes: scanned ${scannedDocs} comments doc(s) on published posts, `
    + `recovered ${recovered.length} quote(s); analytics outcomes for ${withAnalyticsResult} `
    + `(${attachedByAnalytics} attached, ${noMatchByAnalytics} no-match); `
    + `${recovered.filter((entry) => entry.markPresentInCurrentDoc).length} marks still present `
    + `→ ${RECOVERED_QUOTES_FILE}`,
  );
}
