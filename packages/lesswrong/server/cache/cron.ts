import PageCacheRepo from '../repos/PageCacheRepo';

export async function clearExpiredPageCacheEntries() {
  const pageCacheRepo = new PageCacheRepo();
  await pageCacheRepo.clearExpiredEntries();
}
