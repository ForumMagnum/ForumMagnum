import Spotlights from '../lib/collections/spotlights/collection';
import { addCronJob } from './cron/cronUtil';

const MS_IN_DAY = 1000 * 60 * 60 * 24;

export const updatePromotedSpotlightItemCron = addCronJob({
  name: 'updatePromotedSpotlightItem',
  interval: `every 30 minutes`,
  async job() {
    const spotlights = await Spotlights.find({ draft: false }).fetch();
    if (!spotlights.length) return;

    // Ascending order
    const mostRecentlyPromotedSpotlights = [...spotlights].sort((first, second) => first.lastPromotedAt.valueOf() - second.lastPromotedAt.valueOf());
    const positionAscOrderedSpotlights = [...spotlights].sort((first, second) => first.position - second.position);

    const [currentSpotlight] = mostRecentlyPromotedSpotlights.slice(-1);
    const [lastSpotlightByPosition] = positionAscOrderedSpotlights.slice(-1);

    if (!currentSpotlight || !lastSpotlightByPosition) return;

    const now = new Date();
    const lastPromotionDate = new Date(currentSpotlight.lastPromotedAt);

    const msSincePromotion = now.valueOf() - lastPromotionDate.valueOf();
    const daysSincePromotion = Math.floor(msSincePromotion / MS_IN_DAY);

    if (daysSincePromotion < currentSpotlight.duration) {
      return;
    }

    const currentSpotlightPosition = currentSpotlight.position;
    const lastSpotlightPosition = lastSpotlightByPosition.position;

    // If we have any further spotlight items after the current one, promote the next one
    // Otherwise, roll over to the start
    const promoteIndex = lastSpotlightPosition > currentSpotlightPosition
      ? positionAscOrderedSpotlights.indexOf(currentSpotlight) + 1
      : 0;

    const { position: positionToPromote } = positionAscOrderedSpotlights[promoteIndex];

    // This, of course, is not exactly the timestamp at which we actually promote this spotlight item.
    // But doing it this way prevents a slow "walk" due to the cron job interval...
    // ...ensuring the promotion happens at around the same time, and each period length is still roughly constant
    const newPromotionDate = new Date(lastPromotionDate);
    newPromotionDate.setDate(lastPromotionDate.getDate() + currentSpotlight.duration);

    await Spotlights.rawUpdateOne({ position: positionToPromote, draft: false }, { $set: { lastPromotedAt: newPromotionDate } });
  }
});
