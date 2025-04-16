import { registerMigration } from "./migrationUtils";
import { createAdminContext } from "../vulcan-lib/createContexts";
import { updatePost } from "../collections/posts/mutations";

export default registerMigration({
  name: "updateReviewWinnerSocialPreviewImages",
  dateWritten: "2024-03-01",
  idempotent: true,
  action: async () => {
    const adminContext = createAdminContext();
    const { Posts, ReviewWinners, repos: { reviewWinnerArts } } = adminContext;
    const reviewWinners = await ReviewWinners.find().fetch();
    const reviewWinnerPostIds = reviewWinners.map(rw => rw.postId);
    const activeArt = await reviewWinnerArts.getAllActiveReviewWinnerArt(reviewWinnerPostIds);

    for (let [idx, art] of Object.entries(activeArt)) {
      const postId = reviewWinnerPostIds[parseInt(idx)];
      const imageId = art.splashArtImageUrl.split('f_auto,q_auto/')[1];

      await updatePost({
        data: {
          socialPreview: {
            imageId,
            // We want to keep the default preview text, which is a snippet of the first paragraph of the post.
            text: '',
          }
        }, selector: { _id: postId }
      }, adminContext);
    }
  }
});
