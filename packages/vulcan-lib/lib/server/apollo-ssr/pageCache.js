import LRU from 'lru-cache';

const maxPageCacheSizeBytes = 16*1024*1024; //16MB
const maxCacheAgeMs = 60*1000;

export let pageCache = new LRU({
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
