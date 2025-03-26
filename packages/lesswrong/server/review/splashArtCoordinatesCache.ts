import { SwrCache } from "@/lib/utils/swrCache";
import keyBy from "lodash/keyBy";

export const splashArtCoordinateCache = new SwrCache<{
  coordinatesByReviewWinnerArtId: Record<string, DbSplashArtCoordinate>;
}, [ResolverContext]>({
  generate: async (context) => {
    const { repos } = context;
    const activeSplashArtCoordinates = await repos.splashArtCoordinates.getActiveSplashArtCoordinates();
    return {
      coordinatesByReviewWinnerArtId: keyBy(activeSplashArtCoordinates, (sac) => sac.reviewWinnerArtId)
    };
  },
  expiryMs: 1, // TODO BEFORE MERGE: reset to 1 hour
});

export async function getReviewWinnerArtCoordinates(reviewWinnerArtId: string, context: ResolverContext): Promise<DbSplashArtCoordinate | null> {
  const { coordinatesByReviewWinnerArtId } = await splashArtCoordinateCache.get(context);
  return (
    coordinatesByReviewWinnerArtId[reviewWinnerArtId]
      ?? await context.SplashArtCoordinates.findOne({ reviewWinnerArtId }, { sort: { createdAt: -1 } })
  );
}
