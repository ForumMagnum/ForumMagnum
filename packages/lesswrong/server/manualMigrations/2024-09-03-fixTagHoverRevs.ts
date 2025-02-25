import Revisions from "@/lib/collections/revisions/collection";
import { Tags } from "@/lib/collections/tags/collection";
import { getLatestRev } from "@/server/editor/utils";
import { forEachDocumentBatchInCollection , registerMigration } from "./migrationUtils";

//eslint-disable-file no-console

export default registerMigration({
  name: "fixTagHoverRevs",
  dateWritten: "2024-09-03",
  idempotent: true,
  action: async () => {
    //let latestMismatched: Date|null = null;
    await forEachDocumentBatchInCollection({
      collection: Tags,
      callback: async (batch) => {
        for (const tag of batch) {
          if (tag.deleted) {
            continue;
          }
          const pointedAtRevId = tag.description_latest;
          const [pointedAtRev,actualLatestRev] = await Promise.all([
            Revisions.findOne({_id: pointedAtRevId}),
            getLatestRev(tag._id, "description")
          ]);
          if (!actualLatestRev) {
            if (!isBlank(tag.description)) {
              //eslint-disable-next-line no-console
              console.log(`Tag ${tag.slug} has nonblank description but no latest rev`);
            }
            continue;
          }
          if (!pointedAtRev) {
            if (!isBlank(tag.description)) {
              //eslint-disable-next-line no-console
              console.log(`Tag ${tag.slug} has nonblank description but no pointed-at rev`);
            }
            continue;
          }
          /*if (pointedAtRevId === actualLatestRev._id) {
            if (pointedAtRev.html !== tag.description?.html) {
              console.log(`${tag.slug}: Revision IDs match, but contents mismatched`);
            }
          } else {
            if (actualLatestRev.draft) {
              console.log(`${tag.slug}: Latest rev is a draft`);
            } else {
              if (!latestMismatched) {
                latestMismatched = actualLatestRev.editedAt;
              } else if (actualLatestRev.editedAt && actualLatestRev.editedAt > latestMismatched) {
                latestMismatched = actualLatestRev.editedAt;
              }

              if (tag.description?.html === pointedAtRev.html && tag.description?.html === actualLatestRev.html) {
                console.log(`${tag.slug}: Revision IDs mismatched and denormalized contents match both`);
              } else if (tag.description?.html === pointedAtRev.html) {
                console.log(`${tag.slug}: Revision IDs mismatched and denormalized contents match pointed-at rev`);
              } else if (tag.description?.html === actualLatestRev.html) {
                console.log(`${tag.slug}: Revision IDs mismatched and denormalized contents match latest`);
              } else {
                console.log(`${tag.slug}: Revision IDs mismatched and denormalized contents match neither`);
              }
            }
          }*/

          await Tags.rawUpdateOne(
            {_id: tag._id},
            {$set: {
              description: {
                html: actualLatestRev.html,
                userId: actualLatestRev.userId,
                version: actualLatestRev.version,
                editedAt: actualLatestRev.editedAt,
                wordCount: actualLatestRev.wordCount,
                updateType: actualLatestRev.updateType,
                commitMessage: actualLatestRev.commitMessage,
                originalContents: actualLatestRev.originalContents,
              },
              description_latest: actualLatestRev._id,
            }}
          );
        }
      }
    });
    //console.log(`latestMismatched: ${latestMismatched}`);
  },
});

function isBlank(contents: EditableFieldContents|null|undefined) {
  if (!contents) return true;
  if (!contents.html) return true;
  return !contents.html.length;
}
