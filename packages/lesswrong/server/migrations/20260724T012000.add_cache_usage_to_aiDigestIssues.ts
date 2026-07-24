import AiDigestIssues from "../collections/aiDigestIssues/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await addField(db, AiDigestIssues, "inputTokenCount");
  await addField(db, AiDigestIssues, "uncachedInputTokenCount");
  await addField(db, AiDigestIssues, "cacheReadInputTokenCount");
  await addField(db, AiDigestIssues, "cacheWriteInputTokenCount");
};

export const down = async ({ db }: MigrationContext) => {
  await dropField(db, AiDigestIssues, "inputTokenCount");
  await dropField(db, AiDigestIssues, "uncachedInputTokenCount");
  await dropField(db, AiDigestIssues, "cacheReadInputTokenCount");
  await dropField(db, AiDigestIssues, "cacheWriteInputTokenCount");
};
