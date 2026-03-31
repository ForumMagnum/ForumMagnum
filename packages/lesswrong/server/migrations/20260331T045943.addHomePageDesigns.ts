import HomePageDesigns from "@/server/collections/homePageDesigns/collection";
import { createTable, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, HomePageDesigns);
}

export const down = async ({db}: MigrationContext) => {
  await dropTable(db, HomePageDesigns);
}
