import { addField, dropField } from "./meta/utils"
import Revisions from "../collections/revisions/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Revisions, "pangramAiScore");
  await addField(db, Revisions, "pangramCheckedAt");
  await addField(db, Revisions, "pangramStatus");
  await addField(db, Revisions, "pangramRawResponse");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Revisions, "pangramRawResponse");
  await dropField(db, Revisions, "pangramStatus");
  await dropField(db, Revisions, "pangramCheckedAt");
  await dropField(db, Revisions, "pangramAiScore");
}
