import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { moveImageToCloudinary } from '@/server/scripts/convertImagesToCloudinary';
import { gql } from "graphql-tag";

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
    const { generateCoverImagesForPost } = await import('@/server/scripts/generativeModels/coverImageGeneration');
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

export const upscaleReviewWinnerArtGraphQLTypeDefs = gql`
  extend type Mutation {
    upscaleReviewWinnerArt(reviewWinnerArtId: String!): ReviewWinnerArt
  }
`

export const upscaleReviewWinnerArtGraphQLMutations = {
  upscaleReviewWinnerArt: async (root: void, { reviewWinnerArtId }: { reviewWinnerArtId: string }, context: ResolverContext) => {
    const { currentUser, ReviewWinnerArts } = context;
    if (!currentUser || !userIsAdmin(currentUser)) {
      throw new Error('You must be an admin to upscale review winner art');
    }

    const reviewWinnerArt = await ReviewWinnerArts.findOne({ _id: reviewWinnerArtId });
    if (!reviewWinnerArt) {
      throw new Error(`ReviewWinnerArt ${reviewWinnerArtId} not found`);
    }
    if (!reviewWinnerArt.midjourneyJobId || reviewWinnerArt.midjourneyImageIndex == null) {
      throw new Error('Cannot upscale: this image is missing Midjourney metadata (midjourneyJobId and midjourneyImageIndex)');
    }
    if (reviewWinnerArt.upscaledImageUrl) {
      throw new Error('This image has already been upscaled');
    }

    const {
      upscaleMidjourneyImage,
      createUsageTracker,
      DEFAULT_ILLUSTRATION_MODEL,
      downloadViaBridge,
      startMidjourneyBridge,
      getMjBridgeClientScript,
    } = await import('@/server/scripts/generativeModels/coverImageGeneration');

    await startMidjourneyBridge();
    // eslint-disable-next-line no-console
    console.log("\n=== Paste this into your Midjourney browser tab console: ===\n");
    // eslint-disable-next-line no-console
    console.log(getMjBridgeClientScript());
    // eslint-disable-next-line no-console
    console.log("\n=============================================================\n");

    const tracker = createUsageTracker(DEFAULT_ILLUSTRATION_MODEL);
    const upscaledCdnUrl = await upscaleMidjourneyImage(
      reviewWinnerArt.midjourneyJobId,
      reviewWinnerArt.midjourneyImageIndex,
      tracker
    );

    // Download the upscaled image via bridge and upload to Cloudinary
    // eslint-disable-next-line no-console
    console.log(`Downloading upscaled image ${upscaledCdnUrl} via browser bridge...`);
    const imageData = await downloadViaBridge(upscaledCdnUrl);
    const originId = encodeURIComponent(`upscale_${reviewWinnerArtId}_${Math.random()}`);
    const cloudinaryUrl = await moveImageToCloudinary({ oldUrl: upscaledCdnUrl, originDocumentId: originId, imageData });

    if (!cloudinaryUrl) {
      throw new Error('Failed to upload upscaled image to Cloudinary');
    }

    await ReviewWinnerArts.rawUpdateOne(
      { _id: reviewWinnerArtId },
      { $set: { upscaledImageUrl: cloudinaryUrl } }
    );

    return await ReviewWinnerArts.findOne({ _id: reviewWinnerArtId });
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
