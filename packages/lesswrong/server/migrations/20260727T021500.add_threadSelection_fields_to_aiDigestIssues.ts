import AiDigestIssues from "../collections/aiDigestIssues/collection";
import { addField, dropField } from "./meta/utils";

const fields = [
  "discussionCommentIds",
  "toolCallCount",
  "searchCount",
  "readPostCount",
  "threadPromptVersion",
  "threadSelectionUserPrompt",
  "threadInputTokenCount",
  "threadOutputTokenCount",
  "threadCacheReadInputTokenCount",
  "threadSelectionCostUsd",
] as const;

export const up = async ({ db }: MigrationContext) => {
  for (const field of fields) {
    await addField(db, AiDigestIssues, field);
  }
}

export const down = async ({ db }: MigrationContext) => {
  for (const field of fields) {
    await dropField(db, AiDigestIssues, field);
  }
}
