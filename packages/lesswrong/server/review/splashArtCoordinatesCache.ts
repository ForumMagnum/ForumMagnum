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
  expiryMs: 60*60*1000
});

export async function getReviewWinnerArtCoordinates(reviewWinnerArtId: string, context: ResolverContext): Promise<DbSplashArtCoordinate | null> {
  const { coordinatesByReviewWinnerArtId } = await splashArtCoordinateCache.get(context);
  return coordinatesByReviewWinnerArtId[reviewWinnerArtId];
}
