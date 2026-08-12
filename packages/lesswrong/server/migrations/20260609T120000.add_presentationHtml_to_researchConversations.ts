import ResearchConversations from "../collections/researchConversations/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ResearchConversations, "presentationHtml");
};

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ResearchConversations, "presentationHtml");
};
