import LinkPreviewCaches from "../collections/linkPreviewCaches/collection";
import { createTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await createTable(db, LinkPreviewCaches, true);
}

export const down = async ({db}: MigrationContext) => {
}
