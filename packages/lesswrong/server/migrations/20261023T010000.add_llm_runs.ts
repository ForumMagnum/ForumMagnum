import LlmRuns from "../collections/llmRuns/collection";
import Comments from "../collections/comments/collection";
import Users from "../collections/users/collection";
import { addField, createTable, dropField, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, LlmRuns);
  await addField(db, Users, "llmFamily");
  await addField(db, Comments, "llmRunId");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Comments, "llmRunId");
  await dropField(db, Users, "llmFamily");
  await dropTable(db, LlmRuns);
}
