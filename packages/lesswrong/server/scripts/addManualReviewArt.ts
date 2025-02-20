import { createAdminContext } from "../vulcan-lib/query";
import ReviewWinnerArts from "../../lib/collections/reviewWinnerArts/collection";
import { moveImageToCloudinary } from "./convertImagesToCloudinary";
import { Globals } from "../../lib/vulcan-lib/config";
import { createMutator } from "../vulcan-lib/mutators";

const reviewWinnerArtManualAdditions: ({id: string, prompt: string, url: string})[] = [{
  id: 'vLRxmYCKpmZAAJ3KC',
  prompt: "an elephant that's friends with a seal",
  url: "https://cdn.discordapp.com/attachments/1204502718140649523/1207535719170441246/lwbot_topographic_watercolor_artwork_of_an_elephant_thats_frien_1995ab9d-e775-44ed-adb2-3a8287018169.png?ex=65e00046&is=65cd8b46&hm=5bd63109921ce0334548efa50a9f8083664b851c8417fee1537e6487b8ebc76f&"
}]

const manuallyAddReviewWinnerArt = async () => {
  for (let { prompt, url, id } of reviewWinnerArtManualAdditions) {
    const cloudinaryUrl = await moveImageToCloudinary({oldUrl: url, originDocumentId: prompt});
    if (cloudinaryUrl === null) {
      // eslint-disable-next-line no-console
      console.error(`Failed to upload image to cloudinary for prompt: ${prompt}`);
      continue;
    }

    await createMutator({
      collection: ReviewWinnerArts,
      context: createAdminContext(),
      document: {
        postId: id,
        splashArtImagePrompt: prompt,
        splashArtImageUrl: cloudinaryUrl
      }
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.dir(error, { depth: null })
      throw error
    });
  }
}

Globals.manuallyAddReviewWinnerArt = manuallyAddReviewWinnerArt;
