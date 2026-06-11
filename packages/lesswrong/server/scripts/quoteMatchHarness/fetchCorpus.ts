import "./replCssStub";
import fs from "fs";
import path from "path";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import { CORPUS_DIR, type CorpusDocument } from "./harnessShared";

interface CorpusRow {
  documentId: string
  yjsState: Buffer
  updatedAt: Date
}

const FETCH_BATCH_SIZE = 50;
const PROGRESS_INTERVAL = 500;

/**
 * Snapshot the Yjs state of published Lexical posts into the gitignored
 * harness data directory, one JSON file per post. The published-post id list
 * comes from one joined query; the state blobs are then fetched in batches
 * (one query per batch, not per row) so no single statement pulls the whole
 * corpus's blobs and hits the statement timeout.
 *
 * Unpublished drafts are deliberately excluded: the harness corpus is
 * restricted to published documents, whose contents are not sensitive.
 *
 * Run via: yarn repl dev lw packages/lesswrong/server/scripts/quoteMatchHarness/fetchCorpus.ts "fetchQuoteMatchCorpus({})"
 */
export async function fetchQuoteMatchCorpus({ limit }: { limit?: number } = {}): Promise<void> {
  const db = getSqlClientOrThrow();
  const idRows: Array<{ documentId: string }> = await db.any(`
    -- quoteMatchHarness.fetchQuoteMatchCorpus.ids
    SELECT y."documentId"
    FROM "YjsDocuments" y
    JOIN "Posts" p ON p."_id" = y."documentId"
    WHERE y."collectionName" = 'Posts'
      AND y."documentId" NOT LIKE '%/%'
      AND p."draft" IS FALSE
      AND COALESCE(p."deletedDraft", FALSE) IS FALSE
      AND COALESCE(p."rejected", FALSE) IS FALSE
    ORDER BY y."updatedAt" DESC
    ${limit !== undefined ? "LIMIT $(limit)" : ""}
  `, { limit });
  const documentIds = idRows.map((row) => row.documentId);

  fs.mkdirSync(CORPUS_DIR, { recursive: true });

  const fetchedAt = new Date().toISOString();
  let written = 0;
  for (let offset = 0; offset < documentIds.length; offset += FETCH_BATCH_SIZE) {
    const batchIds = documentIds.slice(offset, offset + FETCH_BATCH_SIZE);
    const rows: CorpusRow[] = await db.any(`
      -- quoteMatchHarness.fetchQuoteMatchCorpus.batch
      SELECT "documentId", "yjsState", "updatedAt"
      FROM "YjsDocuments"
      WHERE "collectionName" = 'Posts' AND "documentId" = ANY($(batchIds))
    `, { batchIds });
    for (const row of rows) {
      const corpusDocument: CorpusDocument = {
        postId: row.documentId,
        yjsStateBase64: Buffer.from(row.yjsState).toString("base64"),
        yjsUpdatedAt: new Date(row.updatedAt).toISOString(),
        fetchedAt,
      };
      fs.writeFileSync(
        path.join(CORPUS_DIR, `${row.documentId}.json`),
        JSON.stringify(corpusDocument),
      );
      written++;
    }
    if (written % PROGRESS_INTERVAL < FETCH_BATCH_SIZE && written > 0) {
      // eslint-disable-next-line no-console
      console.log(`Quote-match corpus: ${written}/${documentIds.length} written...`);
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Quote-match corpus: wrote ${written} snapshot(s) to ${CORPUS_DIR}`);
}
