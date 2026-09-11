import ResearchDocuments from "../collections/researchDocuments/collection";
import ResearchConversations from "../collections/researchConversations/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ResearchDocuments, "icon");
  await addField(db, ResearchDocuments, "sortOrder");
  await addField(db, ResearchConversations, "icon");
};

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ResearchDocuments, "icon");
  await dropField(db, ResearchDocuments, "sortOrder");
  await dropField(db, ResearchConversations, "icon");
};
