import AiDigestIssues from "../../server/collections/aiDigestIssues/collection";
import { createTable, dropTable, updateIndexes } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await createTable(db, AiDigestIssues);
  await updateIndexes(AiDigestIssues);
};

export const down = async ({ db }: MigrationContext) => {
  await dropTable(db, AiDigestIssues);
};
