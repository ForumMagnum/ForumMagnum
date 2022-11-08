import { registerMigration, forEachDocumentBatchInCollection } from "./migrationUtils";
import Posts from "../../lib/collections/posts/collection";
import { convertImagesInPost } from "../scripts/convertImagesToCloudinary";

registerMigration({
  name: "rehostPostImages",
  dateWritten: "2022-11-08",
  idempotent: true,
  action: async () => {
    let postCount = 0;
    let uploadCount = 0;
    await forEachDocumentBatchInCollection({
      collection: Posts,
      batchSize: 100,
      callback: async (posts) => {
        const uploadCounts = await Promise.all(
          // To save cloudinary credits, only convert google docs images since those are the only ones with known problems
          posts.map(post => convertImagesInPost(post._id, url => url.includes("googleusercontent")))
        );
        postCount += posts.length;
        uploadCount += uploadCounts.reduce((a, b) => a + b, 0);

        console.log(`Converted ${uploadCount} images in ${postCount} posts`);
      }
    });
  },
});
