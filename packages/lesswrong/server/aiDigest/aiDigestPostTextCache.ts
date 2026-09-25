import { executePromiseQueue } from "@/lib/utils/asyncUtils";

export interface AiDigestPostTextCacheTarget {
  postId: string;
  revisionId: string;
}

interface AiDigestPostTextCacheRecord extends AiDigestPostTextCacheTarget {
  modelId: string;
  promptVersion: string;
}

function cacheKey({ postId, revisionId, modelId, promptVersion }: AiDigestPostTextCacheRecord): string {
  return [postId, revisionId, modelId, promptVersion].join(":");
}

/** Load immutable revisions for revision-keyed summary and preview caches. */
async function loadAiDigestRevisionBodies(
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

export function findCachedAiDigestPostText<
  Target extends AiDigestPostTextCacheTarget,
  Record extends AiDigestPostTextCacheRecord,
>(targets: Target[], cachedRecords: Record[], modelId: string, promptVersion: string): {
  cachedByPostId: Map<string, Record>;
  missingTargets: Target[];
} {
  const cachedByKey = new Map(cachedRecords.map((record) => [cacheKey(record), record]));
  const cachedByPostId = new Map<string, Record>();
  const missingTargets = targets.filter((target) => {
    const record = cachedByKey.get(cacheKey({ ...target, modelId, promptVersion }));
    if (!record) return true;
    cachedByPostId.set(target.postId, record);
    return false;
  });
  return { cachedByPostId, missingTargets };
}

interface PostTextCacheSelector {
  postId: { $in: string[] };
  revisionId: { $in: string[] };
  modelId: string;
  promptVersion: string;
}

/**
 * Shared cache lifecycle for summaries and previews. Their generators retain
 * their own validation, storage and failure policies.
 */
export async function ensureAiDigestPostTextCache<
  Target extends AiDigestPostTextCacheTarget,
  Record extends AiDigestPostTextCacheRecord,
>({ targets, collection, context, modelId, promptVersion, concurrency, generateAndSave }: {
  targets: Target[];
  collection: { find(selector: PostTextCacheSelector): { fetch(): Promise<Record[]> } };
  context: ResolverContext;
  modelId: string;
  promptVersion: string;
  concurrency: number;
  generateAndSave: (target: Target, revisionHtml: string, modelId: string, promptVersion: string) => Promise<Record | null>;
}): Promise<{
  records: Record[];
  recordsByPostId: Map<string, Record>;
  reusedCount: number;
  generatedCount: number;
  skippedPostCount: number;
}> {
  const cachedRecords = targets.length ? await collection.find({
    postId: { $in: targets.map((target) => target.postId) },
    revisionId: { $in: targets.map((target) => target.revisionId) },
    modelId,
    promptVersion,
  }).fetch() : [];
  const { cachedByPostId, missingTargets } = findCachedAiDigestPostText(
    targets, cachedRecords, modelId, promptVersion,
  );
  const bodyRows = await loadAiDigestRevisionBodies(missingTargets, context);
  const bodyRowsByPostId = new Map(bodyRows.map((row) => [row.postId, row]));
  const tasks = missingTargets.flatMap((target) => {
    const row = bodyRowsByPostId.get(target.postId);
    return row ? [generateAndSave.bind(null, target, row.revisionHtml, modelId, promptVersion)] : [];
  });
  const generatedRecords = (await executePromiseQueue(
    tasks, Math.max(1, Math.floor(concurrency)),
  )).filter((record) => record !== null);
  const recordsByPostId = new Map(cachedByPostId);
  for (const record of generatedRecords) {
    recordsByPostId.set(record.postId, record);
  }
  const records = targets.flatMap((target) => {
    const record = recordsByPostId.get(target.postId);
    return record ? [record] : [];
  });
  return {
    records,
    recordsByPostId,
    reusedCount: cachedByPostId.size,
    generatedCount: generatedRecords.length,
    skippedPostCount: targets.length - records.length,
  };
}
