import { Posts } from '../../lib/collections/posts';
import ReviewWinnerArts from '../../lib/collections/reviewWinnerArts/collection';
import { REVIEW_WINNER_CACHE } from '../../lib/collections/reviewWinners/cache';
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
    
    const reviewWinners = REVIEW_WINNER_CACHE.reviewWinners
    const spotlights = await Spotlights.find({}).fetch()

    for (const winner of reviewWinners) {
      const spotlight = spotlights.find(s => s.documentId === winner._id);

      if (!spotlight) {
        await createMutator({
          collection: Spotlights,
          document: {
            documentId: winner._id,
            documentType: "Post",
            spotlightSplashImageUrl: winner.reviewWinner.reviewWinnerArt.splashArtImageUrl,
            draft: true
          },
          validate: false,
          currentUser: null
        });
        // eslint-disable-next-line
        console.log("Created spotlight for", winner.title)
      } else {
        await updateMutator({
          collection: Spotlights,
          documentId: spotlight._id,
          set: {
            // customSubtitle: `<a href='https://www.lesswrong.com/bestoflesswrong'>Best of LessWrong ${winner.reviewYear}</a>`,
            spotlightSplashImageUrl: winner.reviewWinner.reviewWinnerArt.splashArtImageUrl,
            contextInfo: `<a href='/bestoflesswrong'>Best of LessWrong ${winner.reviewWinner.reviewYear}</a>`,
            showAuthor: true
          },
          context: createAdminContext()
        });
        // eslint-disable-next-line
        console.log("Updated spotlight for", winner.title)
      }
    }
  }
})
