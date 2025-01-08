import Users from "@/lib/collections/users/collection"
import { addRemovedField, dropRemovedField } from "./meta/utils"

export const up = async ({db}: MigrationContext) => {
  await dropRemovedField(db, Users, "givingSeason2024DonatedFlair")
  await dropRemovedField(db, Users, "givingSeason2024VotedFlair")
}

export const down = async ({db}: MigrationContext) => {
  await addRemovedField(db, Users, "givingSeason2024DonatedFlair", new BoolType())
  await addRemovedField(db, Users, "givingSeason2024VotedFlair", new BoolType())
}
