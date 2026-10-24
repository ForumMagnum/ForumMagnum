import LlmRuns from "../collections/llmRuns/collection";
import LlmRunTranscriptEntries from "../collections/llmRunTranscriptEntries/collection";
import Comments from "../collections/comments/collection";
import { addField, createTable, dropField, dropTable, updateIndexes } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, LlmRuns);
  await createTable(db, LlmRunTranscriptEntries);
  await addField(db, Comments, "llmRunId");
  await updateIndexes(Comments);
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Comments, "llmRunId");
  await dropTable(db, LlmRunTranscriptEntries);
  await dropTable(db, LlmRuns);
}
