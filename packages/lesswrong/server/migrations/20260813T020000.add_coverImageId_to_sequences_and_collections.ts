import Sequences from "../collections/sequences/collection";
import Collections from "../collections/collections/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Sequences, "coverImageId");
  await addField(db, Collections, "coverImageId");
};

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Sequences, "coverImageId");
  await dropField(db, Collections, "coverImageId");
};
