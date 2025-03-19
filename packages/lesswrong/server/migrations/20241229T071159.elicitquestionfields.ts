import ElicitQuestions from "@/server/collections/elicitQuestions/collection";
import { addField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ElicitQuestions, "schemaVersion");
  await addField(db, ElicitQuestions, "legacyData");
  await db.none(`ALTER TABLE "ElicitQuestions" ALTER COLUMN "resolvesBy" DROP NOT NULL`);
}

export const down = async ({db}: MigrationContext) => {
}
