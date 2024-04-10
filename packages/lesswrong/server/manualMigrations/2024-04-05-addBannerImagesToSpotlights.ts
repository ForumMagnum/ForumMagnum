import { Posts } from '../../lib/collections/posts';
import ReviewWinnerArts from '../../lib/collections/reviewWinnerArts/collection';
import ReviewWinners from '../../lib/collections/reviewWinners/collection';
import Spotlights from '../../lib/collections/spotlights/collection';
import { getAdminTeamAccount } from '../callbacks/commentCallbacks';
import { updateReviewVoteTotals } from '../reviewVoteUpdate';
import { createAdminContext, createMutator, updateMutator } from '../vulcan-lib';
import { registerMigration } from './migrationUtils';


registerMigration({
  name: "addBannerImagesToSpotlights",
  dateWritten: "2024-04-05",
  idempotent: true,
  action: async () => {
    const reviewWinners = await ReviewWinners.find({}).fetch()
    const spotlights = await Spotlights.find({}).fetch()
    const winnerArts = await ReviewWinnerArts.find({}).fetch()

    const user = await getAdminTeamAccount()

    for (const winner of reviewWinners) {
      const post = await Posts.findOne({_id: winner.postId});
      const spotlightWithNoArt = spotlights.find(s => s.documentId === winner.postId);
      const art = winnerArts.find(a => a.postId === winner.postId);
    
      if (!spotlightWithNoArt && art) {
        await createMutator({
          collection: Spotlights,
          document: {
            documentId: winner.postId,
            documentType: "Post",
            spotlightSplashImageUrl: art.splashArtImageUrl,
            draft: true
          },
          validate: false,
          currentUser: null
        });
      } else if (spotlightWithNoArt && art) {
        await updateMutator({
          collection: Spotlights,
          documentId: spotlightWithNoArt._id,
          set: {
            // customSubtitle: `<a href='https://www.lesswrong.com/bestoflesswrong'>Best of LessWrong ${winner.reviewYear}</a>`,
            spotlightSplashImageUrl: art.splashArtImageUrl
          },
          context: createAdminContext()
        });
        console.log("Updating spotlight for", post?.title);
      }
    }
  }
})
