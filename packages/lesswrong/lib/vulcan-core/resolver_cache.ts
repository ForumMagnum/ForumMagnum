import { performQueryFromViewParameters } from "./default_resolvers";

type CacheEntry = {
  expiresAt: Date,
  terms: ViewTermsBase,
  result: DbObject[],
}

class ResolverCache {
  private cache: Record<string, CacheEntry> = {};

  private getApplicableSlice(
    entry: CacheEntry,
    terms: ViewTermsBase,
  ): false | DbObject[] {
    if (entry.expiresAt < new Date()) {
      return false;
    }

    let result = entry.result;

    const cachedOffset = entry.terms.offset ?? 0;
    const requestedOffset = terms.offset ?? 0;
    if (cachedOffset > requestedOffset) {
      return false;
    } else if (requestedOffset > cachedOffset) {
      const delta = requestedOffset - cachedOffset;
      result = result.slice(delta);
    }

    const requestedLimit = terms.limit ?? Number.MAX_SAFE_INTEGER;
    if (result.length < requestedLimit) {
      return false;
    } else if (result.length > requestedLimit) {
      const delta = result.length - requestedLimit;
      result = result.slice(0, delta);
    }

    return result;
  }

  async resolve<T extends DbObject>(
    collection: CollectionBase<T>,
    terms: ViewTermsBase,
    parameters: any,
    key?: string,
    ttlSeconds?: number,
  ): Promise<T[]> {
    if (key && this.cache[key]) {
      const entry = this.cache[key];
      const slice = this.getApplicableSlice(entry, terms);
      if (slice) {
        return slice as T[];
      }
    }
    const result: T[] = await performQueryFromViewParameters(
      collection,
      terms,
      parameters,
    );
    if (key) {
      ttlSeconds ??= 600;
      this.cache[key] = {
        expiresAt: new Date(Date.now() + (ttlSeconds * 1000)),
        terms,
        result,
      }
    }
    return result;
  }
}

export const resolverCache = new ResolverCache();
