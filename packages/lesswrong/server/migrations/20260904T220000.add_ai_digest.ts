import AiDigestIssues from "../collections/aiDigestIssues/collection";
import EmailEvents from "../collections/emailEvents/collection";
import PostPreviews from "../collections/postPreviews/collection";
import PostSummaries from "../collections/postSummaries/collection";
import Users from "../collections/users/collection";
import { addField, createTable, dropField, dropTable } from "./meta/utils";

export const up = async ({ db }: MigrationContext) => {
  await createTable(db, AiDigestIssues);
  await createTable(db, PostSummaries);
  await createTable(db, PostPreviews);
  await createTable(db, EmailEvents);
  await addField(db, Users, "emailSubscribedToAiDigest");
  await addField(db, Users, "aiDigestPersonalInstructions");
};

export const down = async ({ db }: MigrationContext) => {
  await dropField(db, Users, "aiDigestPersonalInstructions");
  await dropField(db, Users, "emailSubscribedToAiDigest");
  await dropTable(db, EmailEvents);
  await dropTable(db, PostPreviews);
  await dropTable(db, PostSummaries);
  await dropTable(db, AiDigestIssues);
};
