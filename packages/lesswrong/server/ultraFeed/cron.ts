import { addCronJob } from '../cron/cronUtil';
import { UltraFeedEvents } from '../collections/ultraFeedEvents/collection';

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export const clearOldUltraFeedServedEvents = addCronJob({
  name: 'clearOldUltraFeedServedEvents',
  interval: 'every 24 hours',
  async job() {
    const cutoffDate = new Date(Date.now() - FORTY_EIGHT_HOURS_MS);

    const selector = {
      eventType: 'served' as const,
      createdAt: { $lt: cutoffDate },
    };

    await UltraFeedEvents.rawRemove(selector);
  }
}); 
