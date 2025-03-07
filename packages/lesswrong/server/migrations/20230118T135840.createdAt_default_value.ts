export const acceptsSchemaHash = "afb5555a6e3a18714877036b68c63786";

import { getAllCollections } from "@/server/collections/allCollections";
import { updateDefaultValue, dropDefaultValue } from "./meta/utils"

/*
 * NOTE 31-08-2023
 * I've commented out the code for this migration as it should've already be
 * run on all the servers that matter, and it causes errors when trying to
 * bootstrap new instances
 */

export const up = async ({db}: MigrationContext) => {
  for (const collection of getAllCollections()) {
    // await updateDefaultValue(db, collection, "createdAt");
  }
}

export const down = async ({db}: MigrationContext) => {
  for (const collection of getAllCollections()) {
    // await dropDefaultValue(db, collection, "createdAt");
  }
}
