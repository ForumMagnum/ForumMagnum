import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { sleep } from "@/lib/utils/asyncUtils";
import Posts from "@/server/collections/posts/collection";
import Comments from "@/server/collections/comments/collection";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { inventorySchema, lookupResultSchema, type LookupResult, normalizeObUrl, parseLwUrl } from "./content";

interface ArchiveOptions {
  delayMs?: number;
  retryNotFound?: boolean;
  retryErrors?: boolean;
  maxCaptures?: number;
  urlTimeoutMs?: number;
}

interface LookupOptions {
  maxCaptures?: number;
  urlTimeoutMs?: number;
  onProgress?: (message: string) => void;
}

interface RequestProgress {
  deadline: number;
  onProgress: (message: string) => void;
}

interface RunProgress {
  startedAt: number;
  currentStartedAt: number;
  current: string;
  phase: string;
}

function logProgress(message: string) {
  // eslint-disable-next-line no-console
  console.log(`[OB links ${new Date().toISOString()}] ${message}`);
}

function updateProgress(progress: RunProgress, message: string) {
  progress.phase = message;
  logProgress(`${progress.current}: ${message}`);
}

function logHeartbeat(progress: RunProgress) {
  logProgress(`${progress.current}: still working (${formatDuration(Date.now() - progress.currentStartedAt)} on this URL, ${formatDuration(Date.now() - progress.startedAt)} elapsed); ${progress.phase}`);
}

function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000);
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function ignoreProgress(_message: string) {}

function remainingTime(progress: RequestProgress): number {
  const remaining = progress.deadline - Date.now();
  if (remaining <= 0) throw new Error("Per-URL time limit reached; rerun to retry or increase urlTimeoutMs");
  return remaining;
}

interface ArchiveResponse {
  status: number;
  ok: boolean;
  headers: Pick<Headers, "get">;
  body?: Pick<ReadableStream, "cancel"> | null;
  text: () => Promise<string>;
}

/** Resolve using the same legacy-ID lookup as app/lw, without another HTTP request. */
export async function canonicalLwTarget(target: string): Promise<string> {
  const url = parseLwUrl(target);
  if (!url) throw new Error(`Not a LessWrong URL: ${target}`);
  const legacy = /^\/lw\/([a-z0-9]+)(?:\/[^/]+)?(?:\/([a-z0-9]+))?\/?$/i.exec(url.pathname);
  const modern = /^\/posts\/([a-zA-Z0-9]+)(?:\/[^/]+)?\/?$/.exec(url.pathname);
  const post = legacy
    ? await Posts.findOne({ legacyId: parseInt(legacy[1], 36).toString() })
    : modern ? await Posts.findOne({ _id: modern[1] }) : null;
  if (!post) throw new Error(`Cannot resolve LessWrong post: ${target}`);
  const canonical = new URL(postGetPageUrl(post), "https://www.lesswrong.com");
  canonical.search = url.search;
  canonical.hash = url.hash;
  if (legacy?.[2]) {
    const comment = await Comments.findOne({ legacyId: parseInt(legacy[2], 36).toString(), postId: post._id });
    if (!comment) throw new Error(`Cannot resolve LessWrong comment: ${target}`);
    canonical.searchParams.set("commentId", comment._id);
  }
  return canonical.href;
}

/** Only unwrap replay URLs on archive.org, never arbitrary URLs containing /web/. */
export function unwrapArchiveUrl(value: string): string {
  const url = new URL(value, "https://web.archive.org");
  if (url.hostname !== "web.archive.org") return url.href;
  const match = /^\/web\/\d+(?:[a-z]+_)?\/(https?:\/\/.*)$/.exec(url.pathname + url.search + url.hash);
  return match ? match[1] : url.href;
}

export function parseCaptures(value: unknown): Array<{ timestamp: string; original: string }> {
  const rows = z.array(z.array(z.string())).parse(value);
  if (!rows.length) return [];
  if (rows[0].join(",") !== "timestamp,original") throw new Error("Unexpected CDX columns");
  return rows.slice(1).map(row => {
    if (row.length !== 2 || !/^\d{14}$/.test(row[0]) || !normalizeObUrl(row[1])) {
      throw new Error("Malformed CDX capture");
    }
    return { timestamp: row[0], original: row[1] };
  }).sort(compareCaptures);
}

function compareCaptures(a: { timestamp: string }, b: { timestamp: string }): number {
  // Prefer the known-good era, but retain older/newer captures as fallbacks.
  return Math.abs(Number(a.timestamp) - 20221231235959) - Math.abs(Number(b.timestamp) - 20221231235959);
}

async function archiveRequest(url: string, delayMs: number, progress: RequestProgress): Promise<Response> {
  let retryAfterMs = 0;
  for (let attempt = 0; attempt < 4; attempt++) {
    const waitMs = Math.max(delayMs * (2 ** attempt), retryAfterMs);
    if (attempt) progress.onProgress(`Retry ${attempt}/3 in ${formatDuration(waitMs)}: ${url}`);
    await sleep(Math.min(waitMs, remainingTime(progress)));
    const timeoutMs = Math.min(30000, remainingTime(progress));
    try {
      const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs) });
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = response.headers.get("retry-after");
        const parsedRetryAfter = retryAfter && (/^\d+$/.test(retryAfter)
          ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - Date.now());
        retryAfterMs = Math.max(response.status === 429 ? 60000 : 0, Number(parsedRetryAfter) || 0);
        await response.body?.cancel();
        throw new Error(`Archive returned HTTP ${response.status}`);
      }
      return response;
    } catch (error) {
      progress.onProgress(`Request failed (${attempt + 1}/4): ${String(error)}`);
      if (attempt === 3) throw error;
    }
  }
  throw new Error("Archive retries exhausted");
}

export async function findArchivedRedirect(
  source: string,
  delayMs: number,
  request: (url: string, delayMs: number, progress: RequestProgress) => Promise<ArchiveResponse> = archiveRequest,
  options: LookupOptions = {},
): Promise<LookupResult> {
  const maxCaptures = options.maxCaptures ?? 10;
  const urlTimeoutMs = options.urlTimeoutMs ?? 300000;
  if (!Number.isInteger(maxCaptures) || maxCaptures < 1) throw new Error("maxCaptures must be a positive integer");
  if (!Number.isFinite(urlTimeoutMs) || urlTimeoutMs <= 0) throw new Error("urlTimeoutMs must be positive and finite");
  const progress: RequestProgress = {
    deadline: Date.now() + urlTimeoutMs,
    onProgress: options.onProgress ?? ignoreProgress,
  };
  const query = new URL("https://web.archive.org/cdx/search/cdx");
  query.searchParams.set("url", source);
  query.searchParams.set("matchType", "exact");
  query.searchParams.set("output", "json");
  query.searchParams.set("fl", "timestamp,original");
  query.searchParams.set("filter", "statuscode:301");
  // Do not collapse by digest: unrelated redirects can have identical empty bodies.
  // Public CDX does not expose Location; the LW target filter is applied to replay headers below.
  progress.onProgress("Querying CDX for archived redirects");
  const response = await request(query.href, delayMs, progress);
  if (!response.ok) throw new Error(`CDX returned HTTP ${response.status}`);
  const body = await response.text();
  const captures = parseCaptures(body.trim() ? JSON.parse(body) : []);
  progress.onProgress(`Found ${captures.length} captures; checking at most ${maxCaptures}`);
  const errors: string[] = [];
  let checked = 0;
  for (const capture of captures) {
    // CDX exact matching ignores scheme/www, but must not broaden the path/query.
    if (normalizeObUrl(capture.original) !== source) continue;
    if (checked >= maxCaptures) throw new Error(`Capture limit reached (${maxCaptures}/${captures.length}); rerun with a larger maxCaptures to search further`);
    remainingTime(progress);
    checked++;
    progress.onProgress(`Capture ${checked}/${captures.length}: ${capture.timestamp}`);
    const snapshot = `https://web.archive.org/web/${capture.timestamp}id_/${capture.original}`;
    try {
      let replayUrl = snapshot;
      for (let hop = 0; hop < 5; hop++) {
        remainingTime(progress);
        const replay = await request(replayUrl, delayMs, progress);
        const originalLocation = replay.headers.get("x-archive-orig-location");
        const location = originalLocation ?? replay.headers.get("location");
        await replay.body?.cancel();
        if (replay.status >= 400) throw new Error(`Replay returned HTTP ${replay.status}: ${replayUrl}`);
        if (!location && replay.status === 200 && replay.headers.get("x-archive-orig-date")) {
          progress.onProgress("Replay served an archived page (HTTP 200), with no redirect target");
          break;
        }
        if (!location || (!originalLocation && (replay.status < 300 || replay.status >= 400))) {
          throw new Error(`Missing redirect in archived 301 (HTTP ${replay.status}): ${replayUrl}`);
        }
        const absolute = new URL(location, originalLocation ? capture.original : replayUrl).href;
        const archivedTarget = unwrapArchiveUrl(absolute);
        if (parseLwUrl(archivedTarget)) {
          progress.onProgress(`Resolving LW target in the database: ${archivedTarget}`);
          return { source, status: "resolved", archivedTarget, snapshot, target: await canonicalLwTarget(archivedTarget) };
        }
        const next = new URL(absolute);
        // Follow archive's timestamp normalization only, never a live OB redirect.
        if (next.hostname !== "web.archive.org" || normalizeObUrl(archivedTarget) !== source) break;
        if (hop === 4) throw new Error(`Archive redirect loop: ${snapshot}`);
        replayUrl = absolute;
      }
    } catch (error) {
      progress.onProgress(`Capture failed: ${String(error)}`);
      errors.push(String(error));
    }
  }
  if (errors.length) throw new Error(errors.join("\n"));
  return { source, status: "not-found" };
}

async function readCheckpoint(path: string): Promise<LookupResult[]> {
  try {
    return z.array(lookupResultSchema).parse(JSON.parse(await readFile(path, "utf8")));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
}

/** Read-only DB access. Checkpoints atomically after every URL; errors retry on rerun. */
export async function resolveOvercomingBiasLinks(inventoryPath: string, outputPath: string, options: ArchiveOptions = {}) {
  if (resolve(inventoryPath) === resolve(outputPath)) throw new Error("Inventory and lookup output paths must differ");
  const inventory = inventorySchema.parse(JSON.parse(await readFile(inventoryPath, "utf8")));
  const results = new Map((await readCheckpoint(outputPath)).map(result => [result.source, result]));
  const pending: string[] = [];
  for (const source of inventory.urls) {
    if (normalizeObUrl(source) !== source) throw new Error(`Noncanonical source: ${source}`);
    const previous = results.get(source);
    if (previous?.status === "resolved" || (previous?.status === "not-found" && !options.retryNotFound)
      || (previous?.status === "error" && options.retryErrors === false)) continue;
    pending.push(source);
  }
  logProgress(`${inventory.urls.length} URLs; ${inventory.urls.length - pending.length} checkpoint entries skipped; ${pending.length} queued. Checkpoint: ${resolve(outputPath)}`);
  const progress: RunProgress = { startedAt: Date.now(), currentStartedAt: Date.now(), current: "", phase: "" };
  let completed = 0;
  for (const source of pending) {
    progress.current = `[${completed + 1}/${pending.length}] ${source}`;
    progress.currentStartedAt = Date.now();
    updateProgress(progress, "Starting lookup");
    const heartbeat = setInterval(logHeartbeat, 30000, progress);
    let result: LookupResult;
    try {
      result = await findArchivedRedirect(source, Math.max(1000, options.delayMs ?? 2000), archiveRequest, {
        ...options, onProgress: updateProgress.bind(null, progress),
      });
    } catch (error) {
      result = { source, status: "error", error: String(error) };
    } finally {
      clearInterval(heartbeat);
    }
    results.set(source, result);
    await writeFile(`${outputPath}.tmp`, JSON.stringify([...results.values()], null, 2));
    await rename(`${outputPath}.tmp`, outputPath);
    completed++;
    const elapsed = Date.now() - progress.startedAt;
    const remaining = elapsed / completed * (pending.length - completed);
    logProgress(`${progress.current}: ${result.status} in ${formatDuration(Date.now() - progress.currentStartedAt)}; checkpoint saved; ${completed}/${pending.length} done this run; estimated remaining ${formatDuration(remaining)}${result.error ? `; ${result.error}` : ""}`);
  }
  const counts = { resolved: 0, "not-found": 0, error: 0, unprocessed: 0 };
  for (const source of inventory.urls) {
    const result = results.get(source);
    if (result) counts[result.status]++;
    else counts.unprocessed++;
  }
  logProgress(`Finished in ${formatDuration(Date.now() - progress.startedAt)}. Inventory totals: ${JSON.stringify(counts)}. Checkpoint: ${resolve(outputPath)}`);
  return [...results.values()];
}
