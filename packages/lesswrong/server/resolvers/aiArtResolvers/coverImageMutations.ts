import { generateCoverImagesForPost } from '@/server/scripts/generativeModels/coverImages-2023Review';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { gql } from '@apollo/client';

export const generateCoverImagesForPostGraphQLTypeDefs = gql`
  extend type Mutation {
    generateCoverImagesForPost(postId: String!, prompt: String): [ReviewWinnerArt]
  }
`

export const generateCoverImagesForPostGraphQLMutations = {
  generateCoverImagesForPost: async (root: void, { postId, prompt }: { postId: string, prompt?: string }, context: ResolverContext) => {
    const { currentUser } = context;
    if (!currentUser || !userIsAdmin(currentUser)) {
      throw new Error('You must be an admin to generate cover images');
    }
    try {
      const results = await generateCoverImagesForPost(postId, prompt);
      const reviewWinnerArts = results.map(result => result.reviewWinnerArt);
      return reviewWinnerArts;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error generating cover images:', error);
      throw new Error(`Error generating cover images: ${error.message}`);
    }
  },
}

export const flipSplashArtImageGraphQLTypeDefs = gql`
  extend type Mutation {
    flipSplashArtImage(reviewWinnerArtId: String!): Boolean
  }
`

export const flipSplashArtImageGraphQLMutations = {
  flipSplashArtImage: async (root: void, { reviewWinnerArtId }: { reviewWinnerArtId: string }, context: ResolverContext) => {
    const { SplashArtCoordinates, ReviewWinnerArts } = context;
    
    const [currentSplashCoordinates, reviewWinnerArt] = await Promise.all([
      SplashArtCoordinates.findOne({ reviewWinnerArtId }, { sort: { createdAt: -1 } }),
      ReviewWinnerArts.findOne({ _id: reviewWinnerArtId })
    ]);

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
}
