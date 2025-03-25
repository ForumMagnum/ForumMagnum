import { defineMutation } from '@/server/utils/serverGraphqlUtil';
import { generateCoverImagesForPost } from '@/server/scripts/generativeModels/coverImages-2023Review';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import SplashArtCoordinates from '@/server/collections/splashArtCoordinates/collection';
import ReviewWinnerArts from '@/server/collections/reviewWinnerArts/collection';

defineMutation({
  name: 'generateCoverImagesForPost',
  argTypes: '(postId: String!, prompt: String)',
  resultType: 'JSON',
  fn: async (_root: any, { postId, prompt }: { postId: string, prompt?: string }, { currentUser }: { currentUser: any }) => {
    if (!currentUser || !userIsAdmin(currentUser)) {
      throw new Error('You must be an admin to generate cover images');
    }
    try {
      const results = await generateCoverImagesForPost(postId, prompt);
      return results;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error generating cover images:', error);
      throw new Error(`Error generating cover images: ${error.message}`);
    }
  },
});

// Flipping an image needs to flip both the current image and the most recent splash coordiantes
// for that image.
defineMutation({
  name: 'flipSplashArtImage',
  argTypes: '(reviewWinnerArtId: String!)',
  resultType: 'JSON',
  fn: async (_root: any, { reviewWinnerArtId }: { reviewWinnerArtId: string }, { currentUser }: { currentUser: any }) => {
    const currentSplashCoordinates = await SplashArtCoordinates.findOne({ reviewWinnerArtId }, { sort: { createdAt: -1 } });
    const reviewWinnerArt = await ReviewWinnerArts.findOne({ _id: reviewWinnerArtId });

    if (!currentSplashCoordinates || !reviewWinnerArt) {
      throw new Error('No splash art coordinates found for reviewWinnerArtId');
    }
    const { splashArtImageUrl } = reviewWinnerArt;
    
    // flip image by setting a cloudinary url parameter
    const newSplashArtImageUrl = splashArtImageUrl.includes('a_hflip') ? splashArtImageUrl.replace('a_hflip', '') : splashArtImageUrl.replace('upload', 'upload/a_hflip');

    const results = await Promise.all([
      SplashArtCoordinates.rawUpdateOne(
        { _id: currentSplashCoordinates._id },
        { $set: { 
          leftFlipped: !currentSplashCoordinates.leftFlipped,
          middleFlipped: !currentSplashCoordinates.middleFlipped,
          rightFlipped: !currentSplashCoordinates.rightFlipped,
        } },
      ),
      ReviewWinnerArts.rawUpdateOne(
        { _id: reviewWinnerArtId },
        { $set: { splashArtImageUrl: newSplashArtImageUrl } },
      ),
    ]);
    return true;
  },
});
