import AiDigestIssues from "../collections/aiDigestIssues/collection";
import Users from "../collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await addField(db, Users, "aiDigestPersonalInstructions");
  await addField(db, AiDigestIssues, "trigger");
  await addField(db, AiDigestIssues, "personalInstructions");
};

export const down = async ({ db }: MigrationContext) => {
  await dropField(db, AiDigestIssues, "personalInstructions");
  await dropField(db, AiDigestIssues, "trigger");
  await dropField(db, Users, "aiDigestPersonalInstructions");
};
