import { appendFile, writeFile } from "node:fs/promises";
import type { ITask } from "pg-promise";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { getNextVersionAfterSemver, htmlToChangeMetrics } from "@/server/editor/utils";
import { randomId } from "@/lib/random";
import { htmlToPingbacks } from "@/server/pingbacks";
import { forumTypeSetting } from "@/lib/forumTypeUtils";
import { collectionNameSchema, type LinkDocument, type LinkRepair, type LinkRewriter, type StoredRevision, transformContents } from "./content";

export interface LinkInventory {
  urls: string[];
  documents: LinkDocument[];
  errors: Array<LinkDocument & { error: string }>;
}

/**
 * Read-only. Finds posts and comments whose current or newest revision has a
 * link the rewriter recognizes. `ilikePattern` is a cheap SQL prefilter.
 */
export async function collectLinkDocuments(rewriter: LinkRewriter, ilikePattern: string): Promise<LinkInventory> {
  const db = getSqlClientOrThrow();
  const urls = new Set<string>();
  const documents: LinkDocument[] = [];
  const errors: Array<LinkDocument & { error: string }> = [];

  for (const collectionName of collectionNameSchema.options) {
    let afterId = "";
    while (true) {
      const batch = await db.any<{ _id: string; contents_latest: string | null }>(`
        -- collectLinkDocuments.documents
        SELECT _id, contents_latest FROM $(collectionName:name)
        WHERE _id > $(afterId) ORDER BY _id LIMIT 200
      `, { collectionName, afterId });
      if (!batch.length) break;
      const revisions = await db.any<StoredRevision>(`
        -- collectLinkDocuments.revisions
        SELECT r.* FROM $(collectionName:name) d
        LEFT JOIN LATERAL (
          SELECT _id FROM "Revisions"
          WHERE "documentId" = d._id AND "fieldName" = 'contents'
          ORDER BY "editedAt" DESC, _id DESC LIMIT 1
        ) newest ON true
        JOIN "Revisions" r ON r._id = d.contents_latest OR r._id = newest._id
        WHERE d._id IN ($(ids:csv))
          AND (r.html ILIKE $(ilikePattern)
            OR r."originalContents"::text ILIKE $(ilikePattern))
      `, { collectionName, ids: batch.map(document => document._id), ilikePattern });
      const affectedIds = new Set<string>();
      for (const revision of revisions) {
        if (!revision.documentId) continue;
        try {
          const contents = transformContents(revision, rewriter);
          for (const url of contents.urls) urls.add(url);
          if (contents.urls.length) affectedIds.add(revision.documentId);
        } catch (error) {
          errors.push({ collectionName, documentId: revision.documentId, error: String(error) });
        }
      }
      for (const documentId of affectedIds) documents.push({ collectionName, documentId });
      afterId = batch[batch.length - 1]._id;
    }
  }
  return { urls: [...urls].sort(), documents, errors };
}

interface RevisionEdit {
  base: StoredRevision;
  revision: StoredRevision;
  updatePointer: boolean;
  links: Array<{ from: string; to: string }>;
}

/** Pure planning step, shared by dry runs and writes. */
export function planRevisionEdits(
  active: StoredRevision,
  latest: StoredRevision,
  repair: LinkRepair,
  now = new Date(),
): RevisionEdit[] {
  if (latest._id !== active._id && latest.draft !== true) {
    throw new Error("contents_latest disagrees with the latest non-draft revision; inspect before repairing");
  }
  const activeContents = transformContents(active, repair);
  const draftContents = latest._id !== active._id ? transformContents(latest, repair) : null;
  if (!activeContents.changed && !draftContents?.changed) return [];
  const edits: RevisionEdit[] = [];
  let previous = latest;
  for (const { base, contents, updatePointer } of [
    { base: active, contents: activeContents, updatePointer: true },
    ...(draftContents ? [{ base: latest, contents: draftContents, updatePointer: false }] : []),
  ]) {
    // Reappend an unchanged newer draft too, so getLatestRev still returns the
    // author's unpublished work after we append a repaired published revision.
    if (updatePointer && !contents.changed) continue;
    const revision: StoredRevision = {
      ...base,
      _id: randomId(),
      html: contents.html,
      originalContents: contents.originalContents,
      version: getNextVersionAfterSemver(previous.version, "patch", base.draft === true),
      updateType: "patch",
      editedAt: new Date(Math.max(now.getTime(), latest.editedAt.getTime() + 1) + edits.length),
      createdAt: now,
      autosaveTimeoutStart: null,
      userId: null,
      commitMessage: contents.changed ? repair.commitMessage : repair.preservedDraftCommitMessage,
      changeMetrics: htmlToChangeMetrics(base.html ?? "", contents.html),
      skipAttributions: true,
    };
    const links: Array<{ from: string; to: string }> = [];
    for (const from of contents.urls) {
      const to = repair.replace(from);
      if (to !== from) links.push({ from, to });
    }
    edits.push({ base, revision, updatePointer, links });
    previous = revision;
  }
  return edits;
}

interface RepairReport extends LinkDocument {
  status: "unchanged" | "would-rewrite" | "rewritten" | "error";
  revisions?: Array<{
    baseRevisionId: string;
    revisionId: string;
    draft: boolean | null;
    version: string;
    links: Array<{ from: string; to: string }>;
  }>;
  error?: string;
}

async function repairDocument(
  document: LinkDocument,
  repair: LinkRepair,
  dryRun: boolean,
  tx: ITask<{}>,
): Promise<RepairReport> {
  if (!dryRun) await tx.none("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
  const { collectionName, documentId } = document;
  const row = await tx.one<{ contents_latest: string | null; contents?: EditableFieldContents | null }>(`
    SELECT contents_latest ${collectionName === "Comments" ? ", contents" : ""}
    FROM $(collectionName:name) WHERE _id = $(documentId) ${dryRun ? "" : "FOR UPDATE"}
  `, { collectionName, documentId });
  // Many legacy comments have no contents_latest, and render from their contents
  // cache instead. Use the newest published revision, which the cache check
  // below requires to match what is rendered.
  if (!row.contents_latest && !row.contents) throw new Error("Document has no contents_latest revision");
  const active = await tx.one<StoredRevision>(`
    SELECT * FROM "Revisions" WHERE ${row.contents_latest ? "_id = $(revisionId)" : "draft IS NOT TRUE"}
      AND "documentId" = $(documentId) AND "fieldName" = 'contents'
      AND ("collectionName" = $(collectionName) OR "collectionName" IS NULL)
    ORDER BY "editedAt" DESC, _id DESC LIMIT 1
    ${dryRun ? "" : "FOR UPDATE"}
  `, { revisionId: row.contents_latest, documentId, collectionName });
  const latest = await tx.one<StoredRevision>(`
    SELECT * FROM "Revisions" WHERE "documentId" = $(documentId) AND "fieldName" = 'contents'
    ORDER BY "editedAt" DESC, _id DESC LIMIT 1 ${dryRun ? "" : "FOR UPDATE"}
  `, { documentId });
  if (row.contents && (row.contents.html !== active.html
    || JSON.stringify(row.contents.originalContents) !== JSON.stringify(active.originalContents))) {
    throw new Error("Comment contents differ from its revision; inspect before repairing");
  }
  const edits = planRevisionEdits(active, latest, repair, new Date());
  if (!dryRun) {
    for (const edit of edits) {
      // This is a maintenance migration: deliberately bypass user-edit callbacks
      // (notifications, moderation, image uploads). Clone the immutable revision
      // and atomically update its pointer/cache, as in convertImagesToCloudinary.
      await tx.none(`
        INSERT INTO "Revisions"
        SELECT * FROM jsonb_populate_record(NULL::"Revisions", $(revision)::jsonb)
      `, { revision: JSON.stringify(edit.revision) });
      if (edit.updatePointer) {
        const pingbacks = await htmlToPingbacks(edit.revision.html ?? "", [{ collectionName, documentId }], forumTypeSetting.get());
        await tx.none(`
          UPDATE $(collectionName:name) SET contents_latest = $(revisionId), pingbacks = $(pingbacks)::jsonb
          ${collectionName === "Comments" ? `, contents = COALESCE(contents, '{}'::jsonb) || $(contents)::jsonb` : ""}
          WHERE _id = $(documentId)
        `, {
          collectionName, documentId, revisionId: edit.revision._id, pingbacks: JSON.stringify(pingbacks),
          contents: JSON.stringify({
            html: edit.revision.html,
            originalContents: edit.revision.originalContents,
            version: edit.revision.version,
            editedAt: edit.revision.editedAt,
            updateType: edit.revision.updateType,
            userId: edit.revision.userId,
            commitMessage: edit.revision.commitMessage,
            wordCount: edit.revision.wordCount,
          }),
        });
        if (collectionName === "Posts") {
          await tx.none('DELETE FROM "SideCommentCaches" WHERE "postId" = $(documentId)', { documentId });
        }
      }
    }
  }
  return {
    ...document,
    status: edits.length ? (dryRun ? "would-rewrite" : "rewritten") : "unchanged",
    revisions: edits.map(({ base, revision, links }) => ({
      baseRevisionId: base._id, revisionId: revision._id,
      draft: revision.draft, version: revision.version, links,
    })),
  };
}

/**
 * Repairs each document in its own transaction, writing one JSONL report line
 * per document to `reportPath`. Only writes revisions when `dryRun` is false.
 */
export async function repairLinkDocuments(
  documents: LinkDocument[],
  repair: LinkRepair,
  reportPath: string,
  dryRun: boolean,
) {
  await writeFile(reportPath, "");
  const stats = { rewritten: 0, wouldRewrite: 0, unchanged: 0, errors: 0 };
  const db = getSqlClientOrThrow();
  for (const document of documents) {
    let report: RepairReport;
    try {
      report = await db.tx(repairDocument.bind(null, document, repair, dryRun));
      if (report.status === "rewritten") stats.rewritten++;
      else if (report.status === "would-rewrite") stats.wouldRewrite++;
      else stats.unchanged++;
    } catch (error) {
      stats.errors++;
      report = { ...document, status: "error", error: String(error) };
    }
    await appendFile(reportPath, `${JSON.stringify(report)}\n`);
  }
  return stats;
}
