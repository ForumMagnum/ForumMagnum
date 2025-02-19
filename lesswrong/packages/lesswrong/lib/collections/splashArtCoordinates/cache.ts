import keyBy from "lodash/keyBy";
import moment from "moment";

interface SplashArtCoordinateCache {
  coordinatesByReviewWinnerArtId: Record<string, DbSplashArtCoordinate>;
  lastUpdatedAt: Date;
}

const SPLASH_ART_COORDINATES_CACHE: SplashArtCoordinateCache = {
  coordinatesByReviewWinnerArtId: {},
  lastUpdatedAt: new Date()
};

export async function updateSplashArtCoordinateCache(context: ResolverContext) {
  const activeSplashArtCoordinates = await context.repos.splashArtCoordinates.getActiveSplashArtCoordinates();
  SPLASH_ART_COORDINATES_CACHE.coordinatesByReviewWinnerArtId = keyBy(activeSplashArtCoordinates, (sac) => sac.reviewWinnerArtId);
  SPLASH_ART_COORDINATES_CACHE.lastUpdatedAt = new Date();
}

export async function getReviewWinnerArtCoordinates(reviewWinnerArtId: string, context: ResolverContext): Promise<DbSplashArtCoordinate | null> {
  const cacheStale = moment(SPLASH_ART_COORDINATES_CACHE.lastUpdatedAt).isBefore(moment(new Date()).subtract(1, 'hour'));
  if (cacheStale) {
    void updateSplashArtCoordinateCache(context);
  }

  return (
    SPLASH_ART_COORDINATES_CACHE.coordinatesByReviewWinnerArtId[reviewWinnerArtId] ??
    await context.SplashArtCoordinates.findOne({ reviewWinnerArtId }, { sort: { createdAt: -1 } })
  );
}
