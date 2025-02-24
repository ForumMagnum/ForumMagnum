import { rehostImagesInAllPosts } from "../scripts/convertImagesToCloudinary";
import { registerMigration } from "./migrationUtils";

export default registerMigration({
  name: "rehostPostImages",
  dateWritten: "2022-11-08",
  idempotent: true,
  action: async () => {
    // To save cloudinary credits, only convert google docs images since those are the only ones with known problems
    await rehostImagesInAllPosts({}, (url) => url.includes("googleusercontent"));
  },
});
