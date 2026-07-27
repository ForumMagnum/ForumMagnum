import AiDigestIssues from "../collections/aiDigestIssues/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await addField(db, AiDigestIssues, "quickTakeIds");
}

export const down = async ({ db }: MigrationContext) => {
  await dropField(db, AiDigestIssues, "quickTakeIds");
}
