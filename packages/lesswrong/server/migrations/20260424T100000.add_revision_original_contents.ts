import RevisionOriginalContents from "@/server/collections/revisionOriginalContents/collection";
import Revisions from "@/server/collections/revisions/collection";
import { addField, createTable, dropField, dropTable, updateIndexes } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await createTable(db, RevisionOriginalContents);
  await addField(db, Revisions, "originalContentsId");
  await updateIndexes(Revisions);
};

export const down = async ({ db }: MigrationContext) => {
  await dropField(db, Revisions, "originalContentsId");
  await dropTable(db, RevisionOriginalContents);
};
