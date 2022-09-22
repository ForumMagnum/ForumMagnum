import Spotlights from '../lib/collections/spotlights/collection';
import { addCronJob } from './cronUtil';

const MS_IN_DAY = 1000 * 60 * 60 * 24;
const ACTIVE_DAYS = 3;

addCronJob({
  name: 'updatePromotedSpotlightItem',
  interval: `every 30 minutes`,
  async job() {
    const [currentSpotlight, lastSpotlightByPosition] = await Promise.all([
      Spotlights.findOne({}, { sort: { lastPromotedAt: -1 } }),
      Spotlights.findOne({}, { sort: { position: -1 } })
    ]);

    if (!currentSpotlight || !lastSpotlightByPosition) return;

    const now = new Date();
    const lastPromotionDate = new Date(currentSpotlight.lastPromotedAt);

    const msSincePromotion = now.valueOf() - lastPromotionDate.valueOf();
    const daysSincePromotion = Math.floor(msSincePromotion / MS_IN_DAY);

    if (daysSincePromotion < ACTIVE_DAYS) {
      return;
    }

    const currentSpotlightPosition = currentSpotlight.position;
    const lastSpotlightPosition = lastSpotlightByPosition.position;

    // If we have any further spotlight items after the current one, promote the next one
    // Otherwise, roll over to the start
    const positionToPromote = lastSpotlightPosition > currentSpotlightPosition
      ? currentSpotlightPosition + 1
      : 0;

    // This, of course, is not exactly the timestamp at which we actually promote this spotlight item.
    // But doing it this way prevents a slow "walk" due to the cron job interval...
    // ...ensuring the promotion happens at around the same time, and each period length is still roughly constant
    const newPromotionDate = new Date(lastPromotionDate);
    newPromotionDate.setDate(lastPromotionDate.getDate() + ACTIVE_DAYS);

    await Spotlights.rawUpdateOne({ position: positionToPromote }, { $set: { lastPromotedAt: newPromotionDate } });
  }
});