import { Tags } from "@/lib/collections/tags/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Tags, "forceAllowType3Audio");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Tags, "forceAllowType3Audio");
}
