import LRU from 'lru-cache';

const maxPageCacheSizeBytes = 16*1024*1024; //16MB
const maxCacheAgeMs = 60*1000;

export const pageCache = new LRU({
  max: maxPageCacheSizeBytes,
  length: (page,key) => JSON.stringify(page).length + JSON.stringify(key).length,
  maxAge: maxCacheAgeMs,
  updateAgeOnGet: false,
});

export const cacheKeyFromReq = (req) => {
  if (req.cookies && req.cookies.timezone)
    return `${req.url.path}&timezone=${req.cookies.timezone}`
  else
    return req.url.path
}

// Dictionary from cache-key => promise that returns the rendering of that page.
const inProgressRenders = {};

export const cachedPageRender = async (req, renderFn) => {
  const cacheKey = cacheKeyFromReq(req);
  const cached = pageCache.get(cacheKey);
  
  // If already cached, return the cached version
  if (cached) {
    recordCacheHit();
    //eslint-disable-next-line no-console
    console.log(`Serving ${req.url.path} from cache; hit rate=${getCacheHitRate()}`);
    return cached;
  }
  
  if (cacheKey in inProgressRenders) {
    recordCacheHit();
    //eslint-disable-next-line no-console
    console.log(`Merging request for ${req.url.path} into in-progress render`);
    
    return inProgressRenders[cacheKey];
  } else {
    recordCacheMiss();
    //eslint-disable-next-line no-console
    console.log(`Rendering ${req.url.path} (not in cache; hit rate=${getCacheHitRate()})`);
    
    const renderPromise = renderFn(req);
    inProgressRenders[cacheKey] = renderPromise;
    renderPromise.then(rendered => {
      pageCache.set(cacheKey, rendered);
      delete inProgressRenders[cacheKey];
    });
    return renderPromise;
  }
}

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
