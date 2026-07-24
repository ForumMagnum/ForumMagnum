import Spotlights from '../server/collections/spotlights/collection';

const MS_IN_DAY = 1000 * 60 * 60 * 24;

export interface SpotlightRotationItem {
  _id: string;
  lastPromotedAt: Date;
  position: number;
  duration: number;
}

export function getNextSpotlightPromotion(spotlights: SpotlightRotationItem[], now: Date) {
  if (!spotlights.length) return null;

  // Ascending order
  const mostRecentlyPromotedSpotlights = [...spotlights].sort((first, second) => first.lastPromotedAt.valueOf() - second.lastPromotedAt.valueOf());
  const positionAscOrderedSpotlights = [...spotlights].sort((first, second) => first.position - second.position);

  const [currentSpotlight] = mostRecentlyPromotedSpotlights.slice(-1);
  const [lastSpotlightByPosition] = positionAscOrderedSpotlights.slice(-1);

  if (!currentSpotlight || !lastSpotlightByPosition) return null;

  const lastPromotionDate = new Date(currentSpotlight.lastPromotedAt);

  const msSincePromotion = now.valueOf() - lastPromotionDate.valueOf();
  const daysSincePromotion = Math.floor(msSincePromotion / MS_IN_DAY);

  if (daysSincePromotion < currentSpotlight.duration) {
    return null;
  }

  const currentSpotlightPosition = currentSpotlight.position;
  const lastSpotlightPosition = lastSpotlightByPosition.position;
  const currentSpotlightIndex = positionAscOrderedSpotlights.findIndex(spotlight => spotlight._id === currentSpotlight._id);

  if (currentSpotlightIndex < 0) return null;

  // If we have any further spotlight items after the current one, promote the next one
  // Otherwise, roll over to the start
  const promoteIndex = lastSpotlightPosition > currentSpotlightPosition
    ? currentSpotlightIndex + 1
    : 0;

  const spotlightToPromote = positionAscOrderedSpotlights[promoteIndex];
  if (!spotlightToPromote) return null;

  // This, of course, is not exactly the timestamp at which we actually promote this spotlight item.
  // But doing it this way prevents a slow "walk" due to the cron job interval...
  // ...ensuring the promotion happens at around the same time, and each period length is still roughly constant
  const newPromotionDate = new Date(lastPromotionDate);
  newPromotionDate.setDate(lastPromotionDate.getDate() + currentSpotlight.duration);

  return {
    spotlightId: spotlightToPromote._id,
    newPromotionDate,
  };
}

export async function updatePromotedSpotlightItem() {
  const now = new Date();
  const spotlights = await Spotlights.find({
    draft: false,
    deletedDraft: false,
    lastPromotedAt: { $lt: now },
  }).fetch();

  const nextPromotion = getNextSpotlightPromotion(spotlights, now);
  if (!nextPromotion) return;

  await Spotlights.rawUpdateOne(
    {
      _id: nextPromotion.spotlightId,
      draft: false,
      deletedDraft: false,
    },
    { $set: { lastPromotedAt: nextPromotion.newPromotionDate } }
  );
}
