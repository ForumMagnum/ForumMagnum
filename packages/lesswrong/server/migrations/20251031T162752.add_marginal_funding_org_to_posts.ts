import { addField, dropField } from "./meta/utils";
import Posts from "../collections/posts/collection";

export const up = async ({db}: MigrationContext) => {
  await addField(db, Posts, "marginalFundingOrg");
}

export const down = async ({db}: MigrationContext) => {
  await dropField(db, Posts, "marginalFundingOrg");
}
