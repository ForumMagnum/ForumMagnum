import LRU from 'lru-cache';
import type { RenderResult } from './renderPage';
import type { CompleteTestGroupAllocation, RelevantTestGroupAllocation } from '../../../lib/abTestImpl';
import { Globals } from '../../../lib/vulcan-lib';

// Page cache. This applies only to logged-out requests, and exists primarily
// to handle the baseload of traffic going to the front page and to pages that
// have gotten linked from high-traffic places.
//
// Complexity here is driven by three things:
//   1. Users that don't share a time zone can't share a page cache, because
//      dates that appear on the page differ;
//   2. Two visitors in different A/B test groups can't share a cache entry,
//      but we don't know which A/B tests were relevant to a page until after
//      we've rendered it; and
//   3. When a page that is getting a lot of traffic expires from the page
//      cache, we don't want to start many rerenders of it in parallel

const maxPageCacheSizeBytes = 32*1024*1024; //32MB
const maxCacheAgeMs = 90*1000;

const pageCache = new LRU<string,RenderResult>({
  max: maxPageCacheSizeBytes,
  length: (page,key) => JSON.stringify(page).length + JSON.stringify(key).length,
  maxAge: maxCacheAgeMs,
  updateAgeOnGet: false,
  dispose: (key: string, page) => {
    const parsedKey: {cacheKey: string, abTestGroups: RelevantTestGroupAllocation} = JSON.parse(key);
    const { cacheKey, abTestGroups } = parsedKey;
    keysToCheckForExpiredEntries.push(cacheKey);
  },
});

// FIXME: This doesn't get updated correctly. Previous iteration had entries
// removed when they should still be in cachedABtestsIndex; current iteration
// has duplicate entries accumulate over time.

const cachedABtestsIndex: Record<string,Array<RelevantTestGroupAllocation>> = {};
let keysToCheckForExpiredEntries: Array<string> = [];

export const cacheKeyFromReq = (req): string => {
  if (req.cookies && req.cookies.timezone)
    return `${req.url.path}&timezone=${req.cookies.timezone}`
  else
    return req.url.path
}

type InProgressRender = {
  cacheKey: string
  abTestGroups: CompleteTestGroupAllocation
  renderPromise: Promise<RenderResult>
};

const inProgressRenders: Record<string,Array<InProgressRender>> = {};

// Serve a page from cache, or render it if necessary. Takes a set of A/B test
// groups for this request, which covers *all* A/B tests (including ones that
// may not be relevant to the request).
export const cachedPageRender = async (req, abTestGroups, renderFn) => {
  //eslint-disable-next-line no-console
  const cacheKey = cacheKeyFromReq(req);
  const cached = cacheLookup(cacheKey, abTestGroups);
  
  
  // If already cached, return the cached version
  if (cached) {
    recordCacheHit();
    //eslint-disable-next-line no-console
    console.log(`Serving ${req.url.path} from cache; hit rate=${getCacheHitRate()}`);
    return {
      ...cached,
      cached: true
    };
  }
  
  if (cacheKey in inProgressRenders) {
    for (let inProgressRender of inProgressRenders[cacheKey]) {
      if (objIsSubset(abTestGroups, inProgressRender.abTestGroups)) {
        const result = await inProgressRender.renderPromise;
        //eslint-disable-next-line no-console
        console.log("Merged request into in-progress render");
        return {
          ...result,
          cached: true,
        };
      }
    }
    //eslint-disable-next-line no-console
    console.log(`In progress render merge of ${cacheKey} missed: mismatched A/B test groups (requested: ${JSON.stringify(abTestGroups)}, available: ${JSON.stringify(inProgressRenders[cacheKey].map(r=>r.abTestGroups))})`);
  }
  
  recordCacheMiss();
  //eslint-disable-next-line no-console
  console.log(`Rendering ${req.url.path} (not in cache; hit rate=${getCacheHitRate()})`);
  
  const renderPromise = renderFn(req);
  
  const inProgressRender = { cacheKey, abTestGroups, renderPromise };
  if (cacheKey in inProgressRenders) {
    inProgressRenders[cacheKey].push(inProgressRender);
  } else {
    inProgressRenders[cacheKey] = [inProgressRender];
  }
  
  const rendered = await renderPromise;
  // eslint-disable-next-line no-console
  console.log(`Completed render with A/B test groups: ${JSON.stringify(rendered.abTestGroups)}`);
  cacheStore(cacheKey, rendered.abTestGroups, rendered);
  
  inProgressRenders[cacheKey] = inProgressRenders[cacheKey].filter(r => r!==inProgressRender);
  if (!inProgressRenders[cacheKey].length)
    delete inProgressRenders[cacheKey];
  
  clearExpiredCacheEntries();
  
  // eslint-disable-next-line no-console
  console.log("New cache state after finishing in-progress render:");
  printCacheState();
  
  return {
    ...rendered,
    cached: false
  };
}


const cacheLookup = (cacheKey: string, abTestGroups: CompleteTestGroupAllocation): RenderResult|null|undefined => {
  if (!(cacheKey in cachedABtestsIndex)) {
    // eslint-disable-next-line no-console
    console.log("Cache miss: no cached page with this cacheKey for any A/B test group combination");
    return null;
  }
  const abTestCombinations: Array<RelevantTestGroupAllocation> = cachedABtestsIndex[cacheKey];
  for (let i=0; i<abTestCombinations.length; i++) {
    if (objIsSubset(abTestCombinations[i], abTestGroups)) {
      const lookupResult = pageCache.get(JSON.stringify({
        cacheKey: cacheKey,
        abTestGroups: abTestCombinations[i]
      }));
      if (lookupResult)
        return lookupResult;
    }
  }
  // eslint-disable-next-line no-console
  console.log(`Cache miss: page is cached, but with the wrong A/B test groups: wanted ${JSON.stringify(abTestGroups)}, had available ${JSON.stringify(cachedABtestsIndex[cacheKey])}`);
  return null;
}

const objIsSubset = (subset,superset): boolean => {
  for (let key in subset) {
    if (!(key in superset) || subset[key] !== superset[key])
      return false;
  }
  return true;
}

const cacheStore = (cacheKey: string, abTestGroups: RelevantTestGroupAllocation, rendered: RenderResult): void => {
  pageCache.set(JSON.stringify({
    cacheKey: cacheKey,
    abTestGroups: abTestGroups
  }), rendered);
  
  if (cacheKey in cachedABtestsIndex)
    cachedABtestsIndex[cacheKey].push(abTestGroups);
  else
    cachedABtestsIndex[cacheKey] = [abTestGroups];
}

const clearExpiredCacheEntries = (): void => {
  for (let cacheKey of keysToCheckForExpiredEntries) {
    const remainingEntries: Record<string,boolean> = {}
    if (cachedABtestsIndex[cacheKey]) {
      for (let abTestGroups of cachedABtestsIndex[cacheKey]) {
        if (pageCache.get(JSON.stringify({ cacheKey, abTestGroups }))) {
          remainingEntries[JSON.stringify(abTestGroups)] = true;
        }
      }
    }
    
    const remainingEntriesArray = Object.keys(remainingEntries).map(groups=>JSON.parse(groups));
    if (remainingEntriesArray.length > 0)
      cachedABtestsIndex[cacheKey] = remainingEntriesArray;
    else
      delete cachedABtestsIndex[cacheKey];
  }
  keysToCheckForExpiredEntries = [];
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

function printCacheState(options:any={}) {
  const {pruneCache=false} = options;
  // eslint-disable-next-line no-console
  const log = console.log;
  
  log('cachedABtestsIndex = {');
  for (let cacheKey of Object.keys(cachedABtestsIndex)) {
    log(`    ${cacheKey}: [`);
    for (let abTestGroup of cachedABtestsIndex[cacheKey]) {
      log(`        ${JSON.stringify(abTestGroup)}`);
    }
    log(`    ],`);
  }
  log("}");
  
  if (pruneCache)
    pageCache.prune();
  log(`pageCache (length=${pageCache.length}) = {`);
  
  let directlyCalculatedLength = 0;
  pageCache.forEach((value,key,cache) => {
    log(`    ${key} => ...`);
    directlyCalculatedLength += JSON.stringify(value).length + JSON.stringify(key).length;
  });
  log("}");
  if (pageCache.length !== directlyCalculatedLength) {
    log("===============");
    log("LENGTH MISMATCH");
    log(`Expected: ${pageCache.length}, found: ${directlyCalculatedLength}`);
    log("===============");
  }
  
  log("inProgressRenders = {");
  for (let cacheKey of Object.keys(inProgressRenders)) {
    log(`    ${cacheKey}: [`);
    for (let inProgressRender of inProgressRenders[cacheKey]) {
      log(`        ${JSON.stringify(inProgressRender.abTestGroups)}`);
    }
    log("    ]");
  }
  log("}");
}
Globals.printCacheState = printCacheState;
