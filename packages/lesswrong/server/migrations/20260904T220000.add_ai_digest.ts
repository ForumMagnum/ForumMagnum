import AiDigestIssueGenerations from "../collections/aiDigestIssueGenerations/collection";
import AiDigestIssues from "../collections/aiDigestIssues/collection";
import AiDigestSchedules from "../collections/aiDigestSchedules/collection";
import PostPreviews from "../collections/postPreviews/collection";
import PostSummaries from "../collections/postSummaries/collection";
import Users from "../collections/users/collection";
import { addField, createTable, dropField, dropTable } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await createTable(db, AiDigestIssues);
  await createTable(db, AiDigestIssueGenerations);
  await createTable(db, AiDigestSchedules);
  await createTable(db, PostSummaries);
  await createTable(db, PostPreviews);
  await addField(db, Users, "emailSubscribedToAiDigest");
  await addField(db, Users, "aiDigestPersonalInstructions");
};

export const down = async ({ db }: MigrationContext) => {
  await dropField(db, Users, "aiDigestPersonalInstructions");
  await dropField(db, Users, "emailSubscribedToAiDigest");
  await dropTable(db, PostPreviews);
  await dropTable(db, PostSummaries);
  await dropTable(db, AiDigestSchedules);
  await dropTable(db, AiDigestIssueGenerations);
  await dropTable(db, AiDigestIssues);
};
