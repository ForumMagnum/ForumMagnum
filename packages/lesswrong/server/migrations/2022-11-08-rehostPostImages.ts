import { registerMigration, forEachDocumentBatchInCollection } from "./migrationUtils";
import Posts from "../../lib/collections/posts/collection";
import { convertImagesInPost } from "../scripts/convertImagesToCloudinary";

registerMigration({
  name: "rehostPostImages",
  dateWritten: "2022-11-08",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Posts,
      batchSize: 50,
      callback: async (posts) => {
        const userAutomodActions = await Promise.all(
          posts.map(post => convertImagesInPost(post._id))
        );
      }
    });
  },
});
