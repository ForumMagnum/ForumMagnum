import LRU from 'lru-cache';
import * as _ from 'underscore';

const maxPageCacheSizeBytes = 16*1024*1024; //16MB
const maxCacheAgeMs = 60*1000;

// Cache keys are JSON serialization of {cacheKey, abTestGroups} where abTestGroups
// maps A/B test name to which group the render is in, for only the subset of
// A/B tests that were relevant.
// We have an index on the side which maps URL -> array of A/B test group
// combinations for which we have cached a rendering. We need this because until
// we render a page, we don't know which subset of A/B tests are relevant to
// that page; given the full set of A/B test groups for a client, we can use the
// index to find the relevant subset and the appropriate cache key. When a cache
// entry is evicted, we remove it from this index.
const pageCache = new LRU({
  max: maxPageCacheSizeBytes,
  length: (page,key) => JSON.stringify(page).length + JSON.stringify(key).length,
  maxAge: maxCacheAgeMs,
  updateAgeOnGet: false,
  dispose: (key,page) => {
    const { cacheKey, abTestGroups } = JSON.parse(key);
    removeCacheABtest(cacheKey, abTestGroups);
  },
});

const cachedABtestsIndex = {};

export const cacheKeyFromReq = (req) => {
  if (req.cookies && req.cookies.timezone)
    return `${req.url.path}&timezone=${req.cookies.timezone}`
  else
    return req.url.path
}

// Dictionary from cache-key => promise that returns the rendering of that page.
const inProgressRenders = {};

// Serve a page from cache, or render it if necessary. Takes a set of A/B test
// groups for this request, which covers *all* A/B tests (including ones that
// may not be relevant to the request).
export const cachedPageRender = async (req, abTestGroups, renderFn) => {
  const cacheKey = cacheKeyFromReq(req);
  const cached = cacheLookup(cacheKey, abTestGroups);
  
  // If already cached, return the cached version
  if (cached) {
    recordCacheHit();
    //eslint-disable-next-line no-console
    console.log(`Serving ${req.url.path} from cache; hit rate=${getCacheHitRate()}`);
    return cached;
  } else {
    recordCacheMiss();
    //eslint-disable-next-line no-console
    console.log(`Rendering ${req.url.path} (not in cache; hit rate=${getCacheHitRate()})`);
    
    const renderPromise = renderFn(req);
    const rendered = await renderPromise;
    cacheStore(cacheKey, rendered.abTestGroups, rendered);
    return rendered;
  }
}


const cacheLookup = (cacheKey, abTestGroups) => {
  if (!(cacheKey in cachedABtestsIndex))
    return null;
  const abTestCombinations = cachedABtestsIndex[cacheKey]; // Array<Record<string,string>>
  for (let i=0; i<abTestCombinations.length; i++) {
    if (objIsSubset(abTestGroups, abTestCombinations[i])) {
      return pageCache.get(JSON.stringify({
        cacheKey: cacheKey,
        abTestGroups: abTestCombinations[i]
      }));
    }
  }
}

const objIsSubset = (subset,superset) => {
  for (let key in subset) {
    if (!(key in superset) || subset[key] !== superset[key])
      return false;
  }
  return true;
}

const cacheStore = (cacheKey, abTestGroups, rendered) => {
  if (!cacheLookup(cacheKey, abTestGroups)) {
    cachedABtestsIndex[cacheKey].push(abTestGroups);
  }
  
  pageCache.set(JSON.stringify({
    cacheKey: cacheKey,
    abTestGroups: abTestGroups
  }), rendered);
}

const removeCacheABtest = (cacheKey, abTestGroups) => {
  cachedABtestsIndex[cacheKey] = _.filter(cachedABtestsIndex[cacheKey],
    g=>!_.isEqual(g, abTestGroups));
};

let cacheHits = 0;
let cacheQueriesTotal = 0;

export function recordCacheHit() {
  cacheHits++;
  cacheQueriesTotal++;
}
export function recordCacheMiss() {
  cacheQueriesTotal++;
}
export function recordCacheBypass() {
  cacheQueriesTotal++;
}
export function getCacheHitRate() {
  return cacheHits / cacheQueriesTotal;
}
