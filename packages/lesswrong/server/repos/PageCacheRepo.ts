import PageCache from "../../lib/collections/pagecache/collection";
import AbstractRepo from "./AbstractRepo";

export type MeanPostKarma = {
  _id: number,
  meanKarma: number,
}

export default class PageCacheRepo extends AbstractRepo<DbPageCacheEntry> {
  constructor() {
    super(PageCache);
  }

  async lookupCacheEntry(path: string): Promise<DbPageCacheEntry | undefined> {
    return undefined;
  }
}
