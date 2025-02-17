import Users from "@/lib/vulcan-users"
import { dropDefaultValue } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await dropDefaultValue(db, Users, "theme");
}

export const down = async ({db}: MigrationContext) => {
  await db.none(`
    ALTER TABLE "Users" ALTER COLUMN theme SET DEFAULT '{"name":"default"}'::JSONB;
  `);
}
