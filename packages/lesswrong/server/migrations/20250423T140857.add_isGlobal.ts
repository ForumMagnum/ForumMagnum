import ForumEvents from "../collections/forumEvents/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  // await addField(db, ForumEvents, "isGlobal");
  await db.none(`
    ALTER TABLE "ForumEvents" ALTER COLUMN "endDate" DROP NOT NULL
  `);
}

export const down = async ({db}: MigrationContext) => {
  // await dropField(db, ForumEvents, "isGlobal");
  await db.none(`
    ALTER TABLE "ForumEvents" ALTER COLUMN "endDate" SET NOT NULL
  `);
}
