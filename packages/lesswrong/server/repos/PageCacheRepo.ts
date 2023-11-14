import type { CompleteTestGroupAllocation, RelevantTestGroupAllocation } from "../../lib/abTestImpl";
import PageCache from "../../lib/collections/pagecache/collection";
import { randomId } from "../../lib/random";
import { getServerBundleHash } from "../utils/bundleUtils";
import AbstractRepo from "./AbstractRepo";
import type { RenderResult } from "../vulcan-lib/apollo-ssr/renderPage"

export type MeanPostKarma = {
  _id: number,
  meanKarma: number,
}

export const maxCacheAgeMs = 90*1000;

export default class PageCacheRepo extends AbstractRepo<DbPageCacheEntry> {
  constructor() {
    super(PageCache);
  }

  async lookupCacheEntry({path, completeAbTestGroups}: {path: string, completeAbTestGroups: CompleteTestGroupAllocation}): Promise<DbPageCacheEntry | null> {
    const bundleHash = getServerBundleHash();

    // Note: we use db.any here rather than e.g. oneOrNone because there may (in principle) be multiple
    // abTestGroups in the db that are a subset of the completeAbTestGroups. In this case it shouldn't
    // matter which one we use, so we just take the first one.
    const cacheResult = await this.getRawDb().any(`
      SELECT * FROM "PageCache"
      WHERE "path" = $1
      AND "bundleHash" = $2
      AND "expiresAt" > NOW()
      AND fm_jsonb_subset($3::jsonb, "abTestGroups")`,
      [path, bundleHash, JSON.stringify(completeAbTestGroups)]);
  
    return cacheResult?.[0] ?? null;
  }

  async clearExpiredEntries(): Promise<void> {
    await this.getRawDb().none(`
      DELETE FROM "PageCache"
      WHERE "expiresAt" < NOW()`);
  }

  upsertPageCacheEntry(path: string, abTestGroups: RelevantTestGroupAllocation, renderResult: RenderResult): Promise<null> {
    const bundleHash = getServerBundleHash();
    const now = new Date();

    return this.getRawDb().none(`
      INSERT INTO "PageCache" (
        "_id",
        "path", 
        "abTestGroups",
        "bundleHash", 
        "renderedAt",
        "expiresAt", 
        "ttlMs",
        "renderResult", 
        "schemaVersion",
        "createdAt"
      ) VALUES (
        $(_id),
        $(path), 
        $(abTestGroups),
        $(bundleHash), 
        $(renderedAt),
        $(expiresAt), 
        $(ttlMs),
        $(renderResult), 
        $(schemaVersion),
        $(createdAt)
      ) ON CONFLICT (
        COALESCE(path, ''),
        "abTestGroups",
        COALESCE("bundleHash", '')
      )
      DO UPDATE
      SET 
        "ttlMs" = $(ttlMs),
        "renderedAt" = $(renderedAt),
        "expiresAt" = $(expiresAt),
        "renderResult" = $(renderResult)
      `, {
      _id: randomId(),
      path,
      abTestGroups,
      bundleHash,
      renderedAt: now,
      expiresAt: new Date(now.getTime() + maxCacheAgeMs),
      ttlMs: maxCacheAgeMs,
      renderResult,
      schemaVersion: 1,
      createdAt: now,
    });
  }
}
