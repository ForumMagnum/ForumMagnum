/* eslint-disable no-console */
import { registerMigration } from './migrationUtils';
import { getSqlClientOrThrow } from '../sql/sqlClient';
import { sanitize } from '@/lib/utils/sanitize';
import { getElementSourceRanges, replaceSourceRanges } from '@/lib/utils/htmlSourceRanges';
import { editableFieldIsNormalized, getEditableCollectionNames, getEditableFieldNamesForCollection } from '../editor/editableSchemaFieldHelpers';

// Until 2026-11-03, renderMathInHtml stored MathJax's output without sanitizing
// it, so TeX could put event handlers, javascript: links and arbitrary styles
// into stored html. This sanitizes the rendered equations (<mjx-container>
// elements) in stored html in place, leaving the rest of the html untouched,
// because stored html includes save-time transformations that can't be
// reproduced from originalContents (see 2026-07-29-restoreMathAriaLabels).
//
// It covers Revisions.html and every denormalized editable field. Idempotent.
//
// Dry run: yarn repl dev lw "packages/lesswrong/server/manualMigrations/2026-11-03-sanitizeStoredEquations.ts" 'sanitizeStoredEquations({dryRun: true})'
// Real run: yarn repl dev lw "packages/lesswrong/server/manualMigrations/2026-11-03-sanitizeStoredEquations.ts"

const SCAN_WINDOW_SIZE = 10000;
const SUSPICIOUS_EQUATION_PATTERN = /\son[a-z]+\s*=|javascript:|position:\s*fixed/i;

interface StoredHtmlLocation {
  description: string,
  tableName: string,
  htmlSql: string,
  updateSql: string,
}

function getStoredHtmlLocations(): StoredHtmlLocation[] {
  const denormalizedFieldLocations = getEditableCollectionNames().flatMap((collectionName) => (
    getEditableFieldNamesForCollection(collectionName)
      .filter((fieldName) => !editableFieldIsNormalized(collectionName, fieldName))
      .map((fieldName) => ({
        description: `${collectionName}.${fieldName}`,
        tableName: collectionName,
        htmlSql: `"${fieldName}"->>'html'`,
        updateSql: `UPDATE "${collectionName}" SET "${fieldName}" = jsonb_set("${fieldName}", '{html}', to_jsonb($(html)::TEXT)) WHERE "_id" = $(_id)`,
      }))
  ));
  return [
    {
      description: 'Revisions.html',
      tableName: 'Revisions',
      htmlSql: '"html"',
      updateSql: 'UPDATE "Revisions" SET "html" = $(html) WHERE "_id" = $(_id)',
    },
    ...denormalizedFieldLocations,
  ];
}

function sanitizeEquationsInHtml(html: string): string {
  return replaceSourceRanges(html, getElementSourceRanges(html, 'mjx-container'), sanitize);
}

function getEquationsHtml(html: string): string {
  return getElementSourceRanges(html, 'mjx-container')
    .map(({ start, end }) => html.slice(start, end))
    .join('');
}

async function sanitizeEquationsAtLocation(location: StoredHtmlLocation, dryRun: boolean) {
  const db = getSqlClientOrThrow();
  let lastScannedId = '';
  let changedCount = 0;
  const suspiciousIds: string[] = [];

  for (;;) {
    const windowEnd = await db.oneOrNone<{ _id: string }>(`
      -- sanitizeStoredEquations.getWindowEnd
      SELECT "_id" FROM "${location.tableName}"
      WHERE "_id" > $(lastScannedId)
      ORDER BY "_id"
      OFFSET $(offset) LIMIT 1
    `, { lastScannedId, offset: SCAN_WINDOW_SIZE - 1 });

    const rows = await db.any<{ _id: string, html: string }>(`
      -- sanitizeStoredEquations.getRowsWithEquations
      SELECT "_id", ${location.htmlSql} AS "html" FROM "${location.tableName}"
      WHERE "_id" > $(lastScannedId)
        ${windowEnd ? 'AND "_id" <= $(windowEndId)' : ''}
        AND ${location.htmlSql} LIKE '%<mjx-container%'
    `, { lastScannedId, windowEndId: windowEnd?._id });

    for (const row of rows) {
      const sanitizedHtml = sanitizeEquationsInHtml(row.html);
      if (sanitizedHtml === row.html) {
        continue;
      }
      changedCount++;
      if (SUSPICIOUS_EQUATION_PATTERN.test(getEquationsHtml(row.html))) {
        suspiciousIds.push(row._id);
      }
      if (!dryRun) {
        await db.none(location.updateSql, { _id: row._id, html: sanitizedHtml });
      }
    }

    if (!windowEnd) {
      break;
    }
    lastScannedId = windowEnd._id;
  }

  console.log(`${location.description}: ${dryRun ? 'would update' : 'updated'} ${changedCount} rows`);
  if (suspiciousIds.length > 0) {
    console.log(`${location.description}: equations with event handlers, javascript: links or fixed positioning in ${suspiciousIds.join(', ')}`);
  }
}

export async function sanitizeStoredEquations({ dryRun }: { dryRun: boolean }) {
  for (const location of getStoredHtmlLocations()) {
    await sanitizeEquationsAtLocation(location, dryRun);
  }

  // Side-comment caches hold a copy of the post body html; they regenerate on demand.
  if (!dryRun) {
    const db = getSqlClientOrThrow();
    await db.none(`
      -- sanitizeStoredEquations.clearSideCommentCaches
      DELETE FROM "SideCommentCaches" WHERE "annotatedHtml" LIKE '%<mjx-container%'
    `);
  }
}

export default registerMigration({
  name: 'sanitizeStoredEquations',
  dateWritten: '2026-11-03',
  idempotent: true,
  action: async () => {
    await sanitizeStoredEquations({ dryRun: false });
  },
});
