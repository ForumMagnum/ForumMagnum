import { appendFile, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ITask } from "pg-promise";
import { z } from "zod";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { getNextVersionAfterSemver, htmlToChangeMetrics } from "@/server/editor/utils";
import { randomId } from "@/lib/random";
import { htmlToPingbacks } from "@/server/pingbacks";
import { forumTypeSetting } from "@/lib/forumTypeUtils";
import { inventorySchema, lookupResultSchema, type LinkDocument, type StoredRevision, normalizeObUrl, parseLwUrl, transformContents } from "./content";

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
  replacements: ReadonlyMap<string, string>,
  now = new Date(),
  excludeFragmentSources?: ReadonlySet<string>,
): RevisionEdit[] {
  if (latest._id !== active._id && latest.draft !== true) {
    throw new Error("contents_latest disagrees with the latest non-draft revision; inspect before repairing");
  }
  const activeContents = transformContents(active, replacements, excludeFragmentSources);
  const draftContents = latest._id !== active._id ? transformContents(latest, replacements, excludeFragmentSources) : null;
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
      commitMessage: contents.changed
        ? "Repair archived Overcoming Bias links to LessWrong"
        : "Preserve unpublished draft after Overcoming Bias link repair",
      changeMetrics: htmlToChangeMetrics(base.html ?? "", contents.html),
      skipAttributions: true,
    };
    const links: Array<{ from: string; to: string }> = [];
    for (const from of contents.urls) {
      const to = replacements.get(from);
      if (to) links.push({ from, to });
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
  replacements: ReadonlyMap<string, string>,
  excludeFragmentSources: ReadonlySet<string>,
  dryRun: boolean,
  tx: ITask<{}>,
): Promise<RepairReport> {
  if (!dryRun) await tx.none("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
  const { collectionName, documentId } = document;
  const row = await tx.one<{ contents_latest: string | null; contents?: EditableFieldContents | null }>(`
    SELECT contents_latest ${collectionName === "Comments" ? ", contents" : ""}
    FROM $(collectionName:name) WHERE _id = $(documentId) ${dryRun ? "" : "FOR UPDATE"}
  `, { collectionName, documentId });
  if (!row.contents_latest) throw new Error("Document has no contents_latest revision");
  const active = await tx.one<StoredRevision>(`
    SELECT * FROM "Revisions" WHERE _id = $(revisionId)
      AND "documentId" = $(documentId) AND "fieldName" = 'contents'
      AND ("collectionName" = $(collectionName) OR "collectionName" IS NULL)
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
  const edits = planRevisionEdits(active, latest, replacements, new Date(), excludeFragmentSources);
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

/** Dry-run by default. Only { dryRun: false } writes revisions. */
export async function rewriteOvercomingBiasLinks(
  inventoryPath: string,
  lookupPath: string,
  reportPath: string,
  { dryRun = true }: { dryRun?: boolean } = {},
) {
  if ([resolve(inventoryPath), resolve(lookupPath)].includes(resolve(reportPath))) throw new Error("Report must not overwrite an input");
  const inventory = inventorySchema.parse(JSON.parse(await readFile(inventoryPath, "utf8")));
  const lookups = z.array(lookupResultSchema).parse(JSON.parse(await readFile(lookupPath, "utf8")));
  const replacements = new Map<string, string>();
  const excludeFragmentSources = new Set<string>();
  for (const lookup of lookups) {
    if (lookup.status !== "resolved") continue;
    const target = lookup.target && parseLwUrl(lookup.target);
    if (normalizeObUrl(lookup.source) !== lookup.source || !target || !/^\/posts\/[^/]+\/[^/]+$/.test(target.pathname)) {
      throw new Error(`Invalid resolved mapping: ${lookup.source}`);
    }
    if (replacements.has(lookup.source) && replacements.get(lookup.source) !== target.href) {
      throw new Error(`Conflicting mappings: ${lookup.source}`);
    }
    replacements.set(lookup.source, target.href);
    if (lookup.excludeFragments) excludeFragmentSources.add(lookup.source);
  }
  await writeFile(reportPath, "");
  const stats = { rewritten: 0, wouldRewrite: 0, unchanged: 0, errors: 0 };
  const db = getSqlClientOrThrow();
  for (const document of inventory.documents) {
    let report: RepairReport;
    try {
      report = await db.tx(repairDocument.bind(null, document, replacements, excludeFragmentSources, dryRun));
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
