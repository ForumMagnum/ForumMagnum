import { ClientIds } from "@/server/collections/clientIds/collection"
import { addField, dropField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await addField(db, ClientIds, 'invalidated');
  await addField(db, ClientIds, 'lastSeenAt');
  await addField(db, ClientIds, 'timesSeen');
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, ClientIds, 'invalidated');
  await dropField(db, ClientIds, 'lastSeenAt');
  await dropField(db, ClientIds, 'timesSeen');
}
