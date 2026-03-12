import { ModerationTemplates } from "../collections/moderationTemplates/collection";
import { addField, dropField } from "./meta/utils";

/**
 * Migration to add groupLabel field to ModerationTemplates.
 * This field allows templates to be grouped by a custom label instead of hardcoded names.
 */
export const up = async ({db}: MigrationContext) => {
  await addField(db, ModerationTemplates, "groupLabel");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ModerationTemplates, "groupLabel");
}
