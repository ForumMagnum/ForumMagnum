import AiDigestIssues from "../collections/aiDigestIssues/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await addField(db, AiDigestIssues, "outputTokenCount");
  await addField(db, AiDigestIssues, "selectionCostUsd");
};

export const down = async ({ db }: MigrationContext) => {
  await dropField(db, AiDigestIssues, "outputTokenCount");
  await dropField(db, AiDigestIssues, "selectionCostUsd");
};
