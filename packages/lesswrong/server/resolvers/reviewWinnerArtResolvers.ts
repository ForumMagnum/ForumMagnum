import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { getReviewWinnerArtCoordinates } from "@/server/review/splashArtCoordinatesCache";

export const reviewWinnerArtResolvers = {
  activeSplashArtCoordinates: {
    resolveAs: {
      type: "SplashArtCoordinate",
      resolver: async (reviewWinnerArt: DbReviewWinnerArt, args: void, context: ResolverContext) => {
        const { currentUser } = context;
        const coordinates = await getReviewWinnerArtCoordinates(reviewWinnerArt._id, context);
        return accessFilterSingle(currentUser, 'SplashArtCoordinates', coordinates, context);
      },
    }
  }
} satisfies Record<string, CollectionFieldSpecification<"ReviewWinnerArts">>;
