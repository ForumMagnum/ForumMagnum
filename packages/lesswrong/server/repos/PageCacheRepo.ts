import type { CompleteTestGroupAllocation, RelevantTestGroupAllocation } from "../../lib/abTestImpl";
import PageCache from "../../lib/collections/pagecache/collection";
import { randomId } from "../../lib/random";
import { getServerBundleHash } from "../utils/bundleUtils";
import AbstractRepo from "./AbstractRepo";
import { recordPerfMetrics } from "./perfMetricWrapper";
import type { RenderResult } from "../vulcan-lib/apollo-ssr/renderPage"

export type MeanPostKarma = {
  _id: number,
  meanKarma: number,
}

/**
 * Omit all fields which can be undefined (which is unfortunately not accomplished by Required<T>, since that only omits *optional* fields)
 */
type SanitizedRenderResult = Omit<RenderResult, Exclude<keyof RenderResult, undefined>>;

export const maxCacheAgeMs = 90*1000;

class PageCacheRepo extends AbstractRepo<"PageCache"> {
  constructor() {
    super(PageCache);
  }

  async lookupCacheEntry({path, completeAbTestGroups}: {path: string, completeAbTestGroups: CompleteTestGroupAllocation}): Promise<DbPageCacheEntry | null> {
    const bundleHash = getServerBundleHash();

    // Note: we use db.any here rather than e.g. oneOrNone because there may (in principle) be multiple
    // abTestGroups in the db that are a subset of the completeAbTestGroups. In this case it shouldn't
    // matter which one we use, so we just take the first one.
    const cacheResult = await this.getRawDb().any(`
      -- PageCacheRepo.lookupCacheEntry
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
      -- PageCacheRepo.clearExpiredEntries
      DELETE FROM "PageCache"
      WHERE "expiresAt" < NOW()`);
  }

  async upsertPageCacheEntry(path: string, abTestGroups: RelevantTestGroupAllocation, renderResult: SanitizedRenderResult): Promise<null> {
    const bundleHash = getServerBundleHash();
    const now = new Date();

    // We wrap this particular query in a try-catch for the nullability migration, where we might encounter race conditions
    // This query failing causes whatever page was loaded to break in weird ways if the promise rejection isn't caught and handled
    try {
      await this.getRawDb().none(`
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
          "path",
          "abTestGroups",
          "bundleHash"
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
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }

    return null;
  }
}

recordPerfMetrics(PageCacheRepo);

export default PageCacheRepo;
