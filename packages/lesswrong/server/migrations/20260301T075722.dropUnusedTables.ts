import { dropField, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await dropTable(db, "AdvisorRequests");
  await dropTable(db, "ForumEvents");
  await dropTable(db, "GardenCodes");
  await dropField(db, "Comments", "forumEventId");
  await dropField(db, "Comments", "forumEventMetadata");
  await dropField(db, "Comments", "subforumStickyPriority");
}

export const down = async ({db}: MigrationContext) => {
}
