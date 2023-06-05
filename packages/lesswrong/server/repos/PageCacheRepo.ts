import type { CompleteTestGroupAllocation } from "../../lib/abTestImpl";
import PageCache from "../../lib/collections/pagecache/collection";
import { getClientBundle } from "../utils/bundleUtils";
import AbstractRepo from "./AbstractRepo";

export type MeanPostKarma = {
  _id: number,
  meanKarma: number,
}

export default class PageCacheRepo extends AbstractRepo<DbPageCacheEntry> {
  constructor() {
    super(PageCache);
  }

  async lookupCacheEntry({path, completeAbTestGroups}: {path: string, completeAbTestGroups: CompleteTestGroupAllocation}): Promise<DbPageCacheEntry | null> {
    const { bundleHash } = getClientBundle();

    // Note: we use db.any here rather than e.g. oneOrNone because there may (in principle) be multiple
    // abTestGroups in the db that are a subset of the completeAbTestGroups. In this case it shouldn't
    // matter which one we use, so we just take the first one.
    const cacheResult = await this.getRawDb().any(`
      SELECT * FROM "PageCache"
      WHERE "path" = $1
      AND "bundleHash" = $2
      AND "expiresAt" > NOW()
      AND jsonb_subset($3::jsonb, "abTestGroups")`,
      [path, bundleHash, JSON.stringify(completeAbTestGroups)]);
  
    return cacheResult?.[0] ?? null;
  }

  async clearExpiredEntries(): Promise<void> {
    await this.getRawDb().none(`
      DELETE FROM "PageCache"
      WHERE "expiresAt" < NOW()`);
  }
}
