/* eslint-disable no-console */
import { registerMigration } from './migrationUtils';
import { getSqlClientOrThrow } from '../sql/sqlClient';
import Revisions from '../collections/revisions/collection';
import SideCommentCaches from '../collections/sideCommentCaches/collection';
import { dataToHTML, extractAndReplaceIframeWidgets } from '../editor/conversionUtils';
import { convertImagesInHTML } from '../scripts/convertImagesToCloudinary';
import { createAnonymousContext } from '../vulcan-lib/createContexts';
import { cheerioParse } from '../utils/htmlUtil';
import type { CheerioAPI, Element as CheerioElement } from 'cheerio';

// The MathJax v2 -> v3 upgrade (b02c15d383, deployed 2026-02-11) introduced
// two problems in server-rendered LaTeX, both baked into the stored html of
// revisions saved while they were live:
//
// 1. Equations lost their accessibility annotations: bare <mjx-container>
//    elements with no aria-label and no text content. `renderMathInHtml` now
//    attaches the TeX source as an aria-label, but the TeX source is
//    unrecoverable from the stored html itself.
// 2. Until 3cf58a1dce (2026-02-20), valid display equations were dropped from
//    the rendered html entirely (the emptiness check predated v3's empty
//    text() output). Additionally, content containing less-common HTML
//    entities failed to render at all (fixed alongside the aria-label change),
//    leaving raw TeX in the stored html.
//
// This migration re-converts affected content from originalContents. For
// revisions whose equations all still line up with the reconversion (case 1),
// it copies the resulting aria-label/role attributes onto the equations in the
// stored html in document order, deliberately not replacing the stored html
// wholesale, because the stored html includes save-time transformations we
// can't reproduce here (cloudinary image mirroring, iframe-widget extraction,
// client-side suggestion discarding). For revisions whose stored html is
// missing equations relative to the reconversion (case 2), it replaces the
// html wholesale, re-runs iframe-widget extraction, and re-mirrors images to
// cloudinary (which no-ops when there are no images to mirror).
//
// Scope: the latest contents revision of published posts. Only revisions with
// unlabeled or missing equations are touched, so this is idempotent and safe
// to re-run.
//
// Dry run: yarn repl dev lw "packages/lesswrong/server/manualMigrations/2026-07-29-restoreMathAriaLabels.ts" 'restoreMathAriaLabels({dryRun: true})'
// Real run: yarn repl dev lw "packages/lesswrong/server/manualMigrations/2026-07-29-restoreMathAriaLabels.ts"

const AFFECTED_RANGE_START = new Date('2026-02-10');

interface AffectedRevisionRow {
  revisionId: string;
  postId: string;
}

type RelabelOutcome = 'labeled' | 'rerendered' | 'alreadyFixed' | 'skipped';

function countByDisplayMode($: CheerioAPI, containers: CheerioElement[]) {
  let inline = 0;
  let display = 0;
  for (const container of containers) {
    if ($(container).attr('display') === 'true') {
      display++;
    } else {
      inline++;
    }
  }
  return { inline, display };
}

async function fixMathInRevision(revisionId: string, context: ResolverContext, dryRun: boolean): Promise<RelabelOutcome> {
  const revision = await Revisions.findOne({ _id: revisionId });
  if (!revision?.html || !revision.originalContents) {
    console.log(`Skipping revision ${revisionId}: missing html or originalContents`);
    return 'skipped';
  }

  const $stored = cheerioParse(revision.html);
  const storedContainers = $stored('mjx-container').toArray();
  if (storedContainers.length > 0 && storedContainers.every(container => $stored(container).attr('aria-label') !== undefined)) {
    return 'alreadyFixed';
  }

  const { data, type } = revision.originalContents;
  // Mirror buildRevision's sanitize flag: html-type originalContents is
  // admin-only and stored unsanitized.
  const regeneratedHtml = await dataToHTML(data, type, context, { sanitize: type !== 'html' });
  const $regenerated = cheerioParse(regeneratedHtml ?? '');
  const regeneratedContainers = $regenerated('mjx-container').toArray();

  if (storedContainers.length === 0 && regeneratedContainers.length === 0) {
    return 'alreadyFixed';
  }

  if (regeneratedContainers.length === storedContainers.length) {
    return await copyAriaLabels({
      revisionId, $stored, storedContainers, $regenerated, regeneratedContainers, dryRun,
    });
  }

  // A stored/regenerated count mismatch normally means the stored html is
  // missing equations due to the display-equation-dropping bug (equal inline
  // counts, fewer display equations) or the entity rendering failure (no
  // rendered equations at all). Both are fixed by replacing the html
  // wholesale. Any other mismatch is unexpected; leave it alone and report it.
  const storedCounts = countByDisplayMode($stored, storedContainers);
  const regeneratedCounts = countByDisplayMode($regenerated, regeneratedContainers);
  const droppedDisplayEquations = storedCounts.inline === regeneratedCounts.inline
    && storedCounts.display < regeneratedCounts.display;
  const neverRendered = storedContainers.length === 0 && regeneratedContainers.length > 0;
  if (droppedDisplayEquations || neverRendered) {
    return await rerenderRevision({ revision, regeneratedHtml: regeneratedHtml ?? '', dryRun });
  }

  console.log(`Skipping revision ${revisionId}: unexpected equation mismatch (stored ${storedCounts.inline} inline + ${storedCounts.display} display, reconverted ${regeneratedCounts.inline} inline + ${regeneratedCounts.display} display)`);
  return 'skipped';
}

async function copyAriaLabels({ revisionId, $stored, storedContainers, $regenerated, regeneratedContainers, dryRun }: {
  revisionId: string,
  $stored: CheerioAPI,
  storedContainers: CheerioElement[],
  $regenerated: CheerioAPI,
  regeneratedContainers: CheerioElement[],
  dryRun: boolean,
}): Promise<RelabelOutcome> {
  // Validate the pairing before mutating anything: every regenerated equation
  // must have a label, and inline/display mode must line up per-index.
  const labels: string[] = [];
  for (let i = 0; i < storedContainers.length; i++) {
    const label = $regenerated(regeneratedContainers[i]).attr('aria-label');
    const storedDisplay = $stored(storedContainers[i]).attr('display');
    const regeneratedDisplay = $regenerated(regeneratedContainers[i]).attr('display');
    if (label === undefined || storedDisplay !== regeneratedDisplay) {
      console.log(`Skipping revision ${revisionId}: equation ${i} mismatch (label ${label === undefined ? 'missing' : 'present'}, display ${storedDisplay} vs ${regeneratedDisplay})`);
      return 'skipped';
    }
    labels.push(label);
  }

  for (let i = 0; i < storedContainers.length; i++) {
    $stored(storedContainers[i])
      .attr('aria-label', labels[i])
      .attr('role', 'math');
  }

  if (!dryRun) {
    await Revisions.rawUpdateOne({ _id: revisionId }, { $set: { html: $stored.html() } });
  }
  return 'labeled';
}

async function rerenderRevision({ revision, regeneratedHtml, dryRun }: {
  revision: DbRevision,
  regeneratedHtml: string,
  dryRun: boolean,
}): Promise<RelabelOutcome> {
  console.log(`${dryRun ? 'Would replace' : 'Replacing'} html of revision ${revision._id} (${revision.collectionName} ${revision.documentId}): stored html is missing equations`);
  if (dryRun) {
    return 'rerendered';
  }

  let newHtml = regeneratedHtml;
  if (newHtml.includes('data-lexical-iframe-widget')) {
    newHtml = await extractAndReplaceIframeWidgets(newHtml, revision._id);
  }

  // Re-mirror images to cloudinary; regenerating from originalContents loses
  // the mirrored URLs the stored html had. This deliberately rewrites the
  // html in place rather than going through convertImagesInObject: that
  // function copies whichever revision of the document has the newest
  // editedAt into a new revision and repoints ${fieldName}_latest at it,
  // which clobbers published content when a draft autosave postdates the
  // published revision.
  if (revision.documentId) {
    try {
      const { count, html: mirroredHtml, failedUrls } = await convertImagesInHTML(newHtml, revision.documentId);
      if (failedUrls.length > 0) {
        console.log(`Failed to mirror images in revision ${revision._id}: ${failedUrls.join(', ')}`);
      }
      if (count > 0) {
        newHtml = mirroredHtml;
      }
    } catch (err) {
      console.error(`Error mirroring images in revision ${revision._id}:`, err);
    }
  }

  await Revisions.rawUpdateOne({ _id: revision._id }, { $set: { html: newHtml } });
  return 'rerendered';
}

export async function restoreMathAriaLabels({ dryRun }: { dryRun: boolean }) {
  const db = getSqlClientOrThrow();
  const context = createAnonymousContext();

  const rows = await db.any<AffectedRevisionRow>(`
    -- restoreMathAriaLabels.findAffectedRevisions
    SELECT r."_id" AS "revisionId", p."_id" AS "postId"
    FROM "Posts" p
    JOIN "Revisions" r ON r."_id" = p."contents_latest"
    WHERE p."draft" IS NOT TRUE
      AND p."deletedDraft" IS NOT TRUE
      AND p."rejected" IS NOT TRUE
      AND r."editedAt" >= $(affectedRangeStart)
      AND (r."html" LIKE '%<mjx-container%' OR r."html" LIKE '%math-tex%')
  `, { affectedRangeStart: AFFECTED_RANGE_START });
  console.log(`Found ${rows.length} candidate revisions${dryRun ? ' (dry run)' : ''}`);

  const updatedPostIds: string[] = [];
  let labeledCount = 0;
  let rerenderedCount = 0;
  let alreadyFixedCount = 0;
  const skippedRevisionIds: string[] = [];

  for (const row of rows) {
    let outcome: RelabelOutcome;
    try {
      outcome = await fixMathInRevision(row.revisionId, context, dryRun);
    } catch (err) {
      console.error(`Error processing revision ${row.revisionId}:`, err);
      outcome = 'skipped';
    }
    if (outcome === 'labeled' || outcome === 'rerendered') {
      updatedPostIds.push(row.postId);
      if (outcome === 'labeled') labeledCount++;
      else rerenderedCount++;
    } else if (outcome === 'alreadyFixed') {
      alreadyFixedCount++;
    } else {
      skippedRevisionIds.push(row.revisionId);
    }
  }

  console.log(`${dryRun ? 'Would update' : 'Updated'} ${updatedPostIds.length} revisions (${labeledCount} labeled in place, ${rerenderedCount} rerendered); ${alreadyFixedCount} already fixed; ${skippedRevisionIds.length} skipped`);
  if (skippedRevisionIds.length > 0) {
    console.log(`Skipped revision ids: ${skippedRevisionIds.join(', ')}`);
  }

  // Side-comment caches hold a copy of the post body html, and their validity
  // check keys off post.modifiedAt, which this migration doesn't bump. Drop
  // them for the affected posts; they regenerate on demand.
  if (!dryRun && updatedPostIds.length > 0) {
    await SideCommentCaches.rawRemove({ postId: { $in: updatedPostIds } });
  }
}

export default registerMigration({
  name: 'restoreMathAriaLabels',
  dateWritten: '2026-07-29',
  idempotent: true,
  action: async () => {
    await restoreMathAriaLabels({ dryRun: false });
  },
});
