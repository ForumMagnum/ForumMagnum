import { addField } from "./meta/utils";
import LinkPreviewCaches from "@/server/collections/linkPreviewCaches/collection";

export const up = async ({ db }: MigrationContext) => {
  await addField(db, LinkPreviewCaches, "originalImageUrl");
  await addField(db, LinkPreviewCaches, "mirroredImageUrl");
  await addField(db, LinkPreviewCaches, "imageWidth");
  await addField(db, LinkPreviewCaches, "imageHeight");
};

export const down = async () => {
};
