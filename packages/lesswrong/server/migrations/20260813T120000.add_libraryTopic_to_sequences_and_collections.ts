import Sequences from "../collections/sequences/collection";
import Collections from "../collections/collections/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Sequences, "libraryTopic");
  await addField(db, Collections, "libraryTopic");
};

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Sequences, "libraryTopic");
  await dropField(db, Collections, "libraryTopic");
};
