import { SwrCache } from "@/lib/utils/swrCache";
import SplashArtCoordinatesRepo from "@/server/repos/SplashArtCoordinatesRepo";
import keyBy from "lodash/keyBy";

export const splashArtCoordinateCache = new SwrCache<{
  coordinatesByReviewWinnerArtId: Record<string, DbSplashArtCoordinate>;
}>({
  generate: async () => {
    const activeSplashArtCoordinates = await new SplashArtCoordinatesRepo().getActiveSplashArtCoordinates();
    return {
      coordinatesByReviewWinnerArtId: keyBy(activeSplashArtCoordinates, (sac) => sac.reviewWinnerArtId)
    };
  },
  expiryMs: 60*60*1000, //1 hour
});

export async function getReviewWinnerArtCoordinates(reviewWinnerArtId: string, context: ResolverContext): Promise<DbSplashArtCoordinate | null> {
  const { coordinatesByReviewWinnerArtId } = await splashArtCoordinateCache.get();
  return coordinatesByReviewWinnerArtId[reviewWinnerArtId];
}
