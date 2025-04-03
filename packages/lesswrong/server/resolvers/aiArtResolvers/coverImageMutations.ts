import { generateCoverImagesForPost } from '@/server/scripts/generativeModels/coverImages-2023Review';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import SplashArtCoordinates from '@/server/collections/splashArtCoordinates/collection';
import ReviewWinnerArts from '@/server/collections/reviewWinnerArts/collection';
import { gql } from 'apollo-server';
import { createMutator } from '@/server/vulcan-lib/mutators';
import { createAdminContext } from '@/server/vulcan-lib/createContexts';
import Spotlights from '@/server/collections/spotlights/collection';

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
}

export const updateSplashArtCoordinatesGraphQLTypeDefs = gql`
  extend type Mutation {
    updateSplashArtCoordinates(postId: String!, reviewWinnerArtId: String!, splashArtImageUrl: String!): Boolean
  }
`

export const updateSplashArtCoordinatesGraphQLMutations = {
  updateSplashArtCoordinates: async (root: void, { postId, reviewWinnerArtId, splashArtImageUrl }: { postId: string, reviewWinnerArtId: string, splashArtImageUrl: string }, context: ResolverContext) => {

    const { data: newSplashArtCoordinates } = await createMutator({
      collection: SplashArtCoordinates,
      context: createAdminContext(),
      document: {
        reviewWinnerArtId,
        leftXPct: .33, // note: XPcts are right-aligned, not left-aligned like you might expect
        leftYPct: .15,
        leftWidthPct: .33, // widths need to be < .33 of the image, because they'll be 3x'd 
        // when we render them on the /bestoflesswrong page (so that when you expand the panel
        // to 3x it's size there is a background image the whole way
        leftHeightPct: .65,
        leftFlipped: true, // for the 2025+ styling (for the 2023) and onward, we want to flip
        // the left-side images because the images are designed to have most of the content on the right side by default (but we want it to show up on the left there)
        middleXPct: .66,
        middleYPct: .15,
        middleWidthPct: .33,
        middleHeightPct: 1,
        middleFlipped: false,
        rightXPct: 0,
        rightYPct: .15,
        rightWidthPct: .33,
        rightHeightPct: .65, 
        rightFlipped: false,
      },
    });

    const spotlight = await Spotlights.findOne({ documentId: postId, documentType: 'Post', deletedDraft: {$ne: true} });

    if (spotlight) {
      await Spotlights.rawUpdateOne(
        { _id: spotlight._id },
        { $set: { spotlightSplashImageUrl: splashArtImageUrl } },
      );
    }


    if (!newSplashArtCoordinates) {
      throw new Error('Error updating splash art coordinates');
    }

    return true;
  },
}
