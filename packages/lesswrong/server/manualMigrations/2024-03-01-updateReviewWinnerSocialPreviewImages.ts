import { registerMigration } from "./migrationUtils";
import { createAdminContext } from "../vulcan-lib/query";
import { updateMutator } from "../vulcan-lib/mutators";

registerMigration({
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

      await updateMutator({
        collection: Posts,
        context: adminContext,
        currentUser: adminContext.currentUser,
        documentId: postId,
        set: {
          socialPreview: {
            imageId,
            // We want to keep the default preview text, which is a snippet of the first paragraph of the post.
            text: '',
          }
        }
      });
    }
  }
});
