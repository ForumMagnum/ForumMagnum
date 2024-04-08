import ReviewWinnerArts from '../../lib/collections/reviewWinnerArts/collection';
import ReviewWinners from '../../lib/collections/reviewWinners/collection';
import Spotlights from '../../lib/collections/spotlights/collection';
import { updateReviewVoteTotals } from '../reviewVoteUpdate';
import { createMutator } from '../vulcan-lib';
import { registerMigration } from './migrationUtils';


registerMigration({
  name: "addBannerImagesToSpotlights",
  dateWritten: "2024-04-05",
  idempotent: true,
  action: async () => {
    const reviewWinners = await ReviewWinners.find({}).fetch()
    const spotlights = await Spotlights.find({}).fetch()
    const winnerArts = await ReviewWinnerArts.find({}).fetch()
    console.log(reviewWinners)
    console.log(reviewWinners.length)
    console.log(spotlights.length)
    reviewWinners.forEach(winner => {
      const spotlight = spotlights.find(s => s.documentId === winner.postId)
      const arts = winnerArts.find(a => a.postId === winner.postId)
      console.log(arts)
      // if (!spotlight) {
      //   if (!art) {
      //     console.log("couldn't find art for ", winner.postId)
      //     return
      //   }
      //   createMutator({
      //     collection: Spotlights,
      //     document: {
      //       documentId: winner.postId,
      //       documentType: "Post",
      //       spotlightSplashImageId: art.splashArtImageUrl,
      //       spotlightSplashImageUrl: art.splashArtImageUrl
      //     },
      //     validate: false,
      //     currentUser: null
      //   })
      // }
    })
  }
})
