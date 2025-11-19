import Spotlights from '../server/collections/spotlights/collection';
import { getPromotionOrderedSpotlights, getDateValue, MS_IN_DAY } from "@/lib/collections/spotlights/spotlightScheduling";

export async function updatePromotedSpotlightItem() {
  const spotlights = await Spotlights.find({ draft: false }).fetch();
  if (!spotlights.length) return;

  const promotionOrderedSpotlights = getPromotionOrderedSpotlights(spotlights);

  const [currentSpotlight] = promotionOrderedSpotlights;
  const nextSpotlight = promotionOrderedSpotlights[1] ?? currentSpotlight;

  if (!currentSpotlight || !nextSpotlight) return;

  const now = new Date();
  const lastPromotionTimestamp = getDateValue(currentSpotlight.lastPromotedAt);
  const lastPromotionDate = new Date(lastPromotionTimestamp);

  const msSincePromotion = now.valueOf() - lastPromotionTimestamp;
  const daysSincePromotion = Math.floor(msSincePromotion / MS_IN_DAY);

  if (daysSincePromotion < (currentSpotlight.duration ?? 0)) {
    return;
  }

  // This, of course, is not exactly the timestamp at which we actually promote this spotlight item.
  // But doing it this way prevents a slow "walk" due to the cron job interval...
  // ...ensuring the promotion happens at around the same time, and each period length is still roughly constant
  const newPromotionDate = new Date(lastPromotionDate);
  newPromotionDate.setDate(lastPromotionDate.getDate() + (currentSpotlight.duration ?? 0));

  await Spotlights.rawUpdateOne({ position: nextSpotlight.position, draft: false }, { $set: { lastPromotedAt: newPromotionDate } });
}
