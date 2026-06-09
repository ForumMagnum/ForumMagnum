import { addField, dropField } from "./meta/utils";
import LinkPreviewCaches from "@/server/collections/linkPreviewCaches/collection";

export const up = async ({ db }: MigrationContext) => {
  await addField(db, LinkPreviewCaches, "redirectedUrl");
};

export const down = async ({ db }: MigrationContext) => {
  await dropField(db, LinkPreviewCaches, "redirectedUrl");
};
