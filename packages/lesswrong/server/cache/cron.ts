import { addCronJob } from '../cron/cronUtil';
import PageCacheRepo from '../repos/PageCacheRepo';

export const cronClearExpiredPageCacheEntries = addCronJob({
  name: 'clearExpiredPageCacheEntries',
  interval: 'every 5 minutes',
  async job() {
    const pageCacheRepo = new PageCacheRepo();
    await pageCacheRepo.clearExpiredEntries();
  }
});
