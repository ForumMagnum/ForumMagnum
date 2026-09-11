import ResearchDocuments from "../collections/researchDocuments/collection";
import ResearchConversations from "../collections/researchConversations/collection";
import ResearchEnvironments from "../collections/researchEnvironments/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, ResearchDocuments, "archived");
  await addField(db, ResearchConversations, "archived");
  await addField(db, ResearchEnvironments, "archived");
};

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ResearchDocuments, "archived");
  await dropField(db, ResearchConversations, "archived");
  await dropField(db, ResearchEnvironments, "archived");
};
