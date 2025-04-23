/* eslint-disable no-console */
import { extractVersionsFromSemver } from "@/lib/editor/utils";
import Posts from "../collections/posts/collection";
import { getNextVersion, getNextVersionAfterSemver } from "../editor/utils";
import { runSqlQuery } from "../sql/sqlClient";
import uniq from "lodash/uniq";
import Revisions from "../collections/revisions/collection";

/**
 * Previously, when posts used the Google Docs import feature, it would create
 * a revision which incremented the major version number. The major version
 * number is used to determine whether to display a post-version selector, and
 * to warn about comments being made against out of date versions. But this
 * feature was intended specifically for old Sequences posts that had an editing
 * pass, and maybe for occasional manual use, and for awhile was being
 * over-applied to any post that uses the Google Docs import feature after
 * first undrafting, or used the Docs import feature more than once.
 *
 * This script goes through old posts where the latest revision version number
 * is 2.0.0 or greature, and renumbers the versions so that revisions which
 * increase the major version to 2.0.0 or greater and have a commitMessage that
 * starts with "[Google Doc import]" increase the minor version instead, and
 * all subsequent revisions are renumbered to have the same relationship to
 * their preceding revision.
 */
export async function lowerGoogleDocsImportMajorVersions({dryRun=true}: {
  dryRun?: boolean
}) {
  if (dryRun) {
    console.log("In dry-run mode");
  } else {
    console.log("NOT in dry-run mode");
  }
  const docsImportRevisions = await runSqlQuery(`
    SELECT _id,version,"documentId","createdAt"
    FROM "Revisions" rev
    WHERE "commitMessage" LIKE '[Google Doc import]%'
  `);
  const postIdsWithDocsImportRevisions = uniq(docsImportRevisions.map(r => r.documentId));
  console.log(`Found ${docsImportRevisions.length} docs-import revisions on ${postIdsWithDocsImportRevisions.length} posts`);
  const revsWithSemverGte2 = docsImportRevisions.filter(r =>
    extractVersionsFromSemver(r.version).major >= 2
  );
  const postIdsWithDocsImportRevisionGte2 = uniq(revsWithSemverGte2.map(r => r.documentId));
  console.log(`Of which ${revsWithSemverGte2.length} have a major version >=2, affecting ${postIdsWithDocsImportRevisionGte2.length} posts`);
  
  for (const postId of postIdsWithDocsImportRevisionGte2) {
    await lowerGoogleDocsImportMajorVersionsOnPost(postId, dryRun);
  }
  console.log("Done");
}

async function lowerGoogleDocsImportMajorVersionsOnPost(postId: string, dryRun: boolean) {
  // Fetch metadata for revisions on the post
  const [revisions,post] = await Promise.all([
    runSqlQuery(`
      SELECT _id,version,"documentId","createdAt","updateType","commitMessage"
      FROM "Revisions" rev
      WHERE "documentId"=$1
      AND "fieldName"='contents'
      ORDER BY "editedAt"
    `, [postId]),
    Posts.findOne({_id: postId})
  ]);
  
  const newVersionNumbers: Record<string,string> = {};
  
  // If the first revision has a major version of 0 or 1, keep its version as-is. Otherwise lower it to 1.0.0.
  const firstMajorVersion = extractVersionsFromSemver(revisions[0].version).major;
  newVersionNumbers[revisions[0]._id] = (firstMajorVersion >= 2)
    ? "1.0.0"
    : revisions[0].version;
  
  // Subsequent revisions increment the version number according to their update type, except that:
  //  * If the old version was 0.x, the new revision must also be 0.x, and v/v
  //  * If the commitMessage starts with "[Google Doc Import]", the updateType is treated as minor rather than major
  console.log(`${postId}: ${post!.title}`);
  for(let i=1; i<revisions.length; i++) {
    const revision = revisions[i];
    const previousVersion = newVersionNumbers[revisions[i-1]._id];
    const updateType = revision.commitMessage && revision.commitMessage.startsWith("[Google Doc import]")
      ? "minor"
      : revision.updateType;
    const oldVersionNumber = revisions[i].version;
    const newVersionNumber = getNextVersionAfterSemver(previousVersion, updateType, revisions[i].draft);
    newVersionNumbers[revisions[i]._id] = newVersionNumber
    if (oldVersionNumber !== newVersionNumber) {
      console.log(`    ${oldVersionNumber} -> ${newVersionNumber}`);
    }
  }

  if (!dryRun) {
    for (const [revisionId,version] of Object.entries(newVersionNumbers)) {
      await Revisions.rawUpdateOne(
        {_id: revisionId},
        {$set: {
          version
        }},
      );
    }
  }
}
