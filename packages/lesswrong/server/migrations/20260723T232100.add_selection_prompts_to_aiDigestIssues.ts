import AiDigestIssues from "../collections/aiDigestIssues/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await addField(db, AiDigestIssues, "selectionSystemPrompt");
  await addField(db, AiDigestIssues, "selectionUserPrompt");
};

export const down = async ({ db }: MigrationContext) => {
  await dropField(db, AiDigestIssues, "selectionSystemPrompt");
  await dropField(db, AiDigestIssues, "selectionUserPrompt");
};
