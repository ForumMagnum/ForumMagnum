import LRU from 'lru-cache';
import type { RenderResult, RenderSuccessResult } from './renderPage';
import { CompleteTestGroupAllocation, RelevantTestGroupAllocation, getABTestsMetadata, getAllUserABTestGroups } from '../../../lib/abTestImpl';
import type { Request, Response } from 'express';
import { getCookieFromReq, getPathFromReq } from '../../utils/httpUtil';
import { isValidSerializedThemeOptions, getDefaultThemeOptions } from '../../../themes/themeNames';
import sumBy from 'lodash/sumBy';
import { healthCheckUserAgentSetting } from './renderUtil';
import PageCacheRepo, { maxCacheAgeMs } from '../../repos/PageCacheRepo';
import { DatabaseServerSetting } from '../../databaseSettings';
import { isDatadogEnabled } from '../../../lib/instanceSettings';
import stringify from 'json-stringify-deterministic';
import { ensureClientId } from '@/server/clientIdMiddleware';

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

const dbPageCacheEnabledSetting = new DatabaseServerSetting<boolean>("dbPageCacheEnabled", true);

const maxPageCacheSizeBytes = 32*1024*1024; //32MB

type CachedRenderResult = Omit<RenderSuccessResult, "prefetchedResources">;

const pageCache = new LRU<string,CachedRenderResult>({
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

const jsonSerializableEstimateSize = (obj: any) => {
  if (typeof obj === "object") {
    let result = 0;
    for (let key of Object.keys(obj)) {
      result += jsonSerializableEstimateSize(key);
      result += jsonSerializableEstimateSize(obj[key]);
    }
    return result;
  } else if (typeof obj === "string") {
    return obj.length;
  } else {
    return 8;
  }
}

// FIXME: This doesn't get updated correctly. Previous iteration had entries
// removed when they should still be in cachedABtestsIndex; current iteration
// has duplicate entries accumulate over time.
const cachedABtestsIndex: Record<string,Array<RelevantTestGroupAllocation>> = {};
let keysToCheckForExpiredEntries: Array<string> = [];

export const cacheKeyFromReq = (req: Request): string => {
  const timezoneCookie = getCookieFromReq(req, "timezone");
  const themeCookie = getCookieFromReq(req, "theme");
  const themeOptions = themeCookie && isValidSerializedThemeOptions(themeCookie) ? themeCookie : stringify(getDefaultThemeOptions());
  const path = getPathFromReq(req);
  
  if (timezoneCookie)
    return `${path}&theme=${themeOptions}&timezone=${timezoneCookie}`;
  else
    return path;
}

type InProgressRender = {
  cacheKey: string
  abTestGroups: CompleteTestGroupAllocation
  renderPromise: Promise<RenderResult>
};

const inProgressRenders: Record<string,Array<InProgressRender>> = {};

function filterLoggedOutActiveAbTestGroups(abTestGroups: CompleteTestGroupAllocation): RelevantTestGroupAllocation {
  const abTests = getABTestsMetadata();
  let result: RelevantTestGroupAllocation = {};
  for (const name of Object.keys(abTestGroups)) {
    const abTest = abTests[name];
    if (abTest.active && abTest.affectsLoggedOut)
      result[name] = abTestGroups[name];
    
  }
  return result;
}

// Serve a page from cache, or render it if necessary. Takes a set of A/B test
// groups for this request, which covers *all* A/B tests (including ones that
// may not be relevant to the request).
export const cachedPageRender = async (
  req: Request,
  res: Response,
  userAgent: string|undefined,
  maybePrefetchResources: () => Promise<boolean | undefined>,
  renderFn: (req: Request, prefetchedResources: Promise<boolean | undefined>) => Promise<RenderResult>
) => {
  // We need to call ensureClientId before prefetching resources (because that might write to the response, and we need to set the headers before that)
  void ensureClientId(req, res);
  const prefetchedResources = maybePrefetchResources();

  const clientId = getCookieFromReq(req, "clientId");
  const abTestGroups = getAllUserABTestGroups({ clientId });
  const path = getPathFromReq(req);
  const cacheKey = cacheKeyFromReq(req);
  const cacheAffectingAbTestGroups = filterLoggedOutActiveAbTestGroups(abTestGroups);
  const cached = await cacheLookup(cacheKey, cacheAffectingAbTestGroups);
  
  // If already cached, return the cached version
  if (cached) {
    recordCacheHit({path, userAgent: userAgent ?? ''});
    //eslint-disable-next-line no-console
    console.log(`Serving ${path} from cache; hit rate=${getCacheHitRate()}`);
    return {
      ...cached,
      prefetchedResources,
      cached: true
    };
  }
  
  if (cacheKey in inProgressRenders) {
    for (let inProgressRender of inProgressRenders[cacheKey]) {
      if (objIsSubset(cacheAffectingAbTestGroups, inProgressRender.abTestGroups)) {
        //eslint-disable-next-line no-console
        console.log(`Merging request for ${path} into in-progress render`);
        const result = await inProgressRender.renderPromise;
        return {
          ...result,
          cached: true,
        };
      }
    }
    //eslint-disable-next-line no-console
    console.log(`In progress render merge of ${cacheKey} missed: mismatched A/B test groups (requested: ${JSON.stringify(cacheAffectingAbTestGroups)}, available: ${JSON.stringify(inProgressRenders[cacheKey].map(r=>r.abTestGroups))})`);
  }
  
  recordCacheMiss({path, userAgent: userAgent ?? ''});
  //eslint-disable-next-line no-console
  console.log(`Rendering ${path} (not in cache; hit rate=${getCacheHitRate()})`);
  
  const renderPromise = renderFn(req, prefetchedResources);
  
  const inProgressRender = {
    cacheKey,
    abTestGroups: cacheAffectingAbTestGroups,
    renderPromise
  };
  if (cacheKey in inProgressRenders) {
    inProgressRenders[cacheKey].push(inProgressRender);
  } else {
    inProgressRenders[cacheKey] = [inProgressRender];
  }
  
  let rendered;
  try {
    rendered = await renderPromise;
    if (!rendered.aborted) {
      // eslint-disable-next-line no-console
      console.log(`Completed render with A/B test groups: ${JSON.stringify(rendered.relevantAbTestGroups)}`);
      // Don't cache the promise; that's the kind of thing that can cause memory leaks
      const { prefetchedResources, ...rest } = rendered;
      cacheStore(cacheKey, rendered.relevantAbTestGroups, rest);
    }  
  } finally {
    inProgressRenders[cacheKey] = inProgressRenders[cacheKey].filter(r => r!==inProgressRender);
    if (!inProgressRenders[cacheKey].length)
      delete inProgressRenders[cacheKey];
  
    // This just clears expired entries from cachedABtestsIndex, the actual page cache is an LRU() so it's cleared automatically
    clearExpiredCacheEntries();  
  }
  
  return {
    ...rendered,
    cached: false
  };
}

const cacheLookupLocal = (cacheKey: string, abTestGroups: CompleteTestGroupAllocation): CachedRenderResult|null|undefined => {
  if (!(cacheKey in cachedABtestsIndex)) {
    // eslint-disable-next-line no-console
    console.log(`Local cache miss for cacheKey ${cacheKey}: no cached page for any A/B test group combination`);
    return null;
  }
  const abTestCombinations: Array<RelevantTestGroupAllocation> = cachedABtestsIndex[cacheKey];
  for (let i=0; i<abTestCombinations.length; i++) {
    if (objIsSubset(abTestCombinations[i], abTestGroups)) {
      const lookupResult = pageCache.get(JSON.stringify({
        cacheKey: cacheKey,
        abTestGroups: abTestCombinations[i]
      }));
      if (lookupResult) {
        // eslint-disable-next-line no-console
        console.log(`Local cache hit for cacheKey ${cacheKey}`);
        return lookupResult;
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Local cache miss for cacheKey ${cacheKey}: wrong A/B test groups: wanted ${JSON.stringify(abTestGroups)}, had available ${JSON.stringify(cachedABtestsIndex[cacheKey])}`);
  return null;
}

const cacheLookupDB = async (cacheKey: string, abTestGroups: CompleteTestGroupAllocation): Promise<CachedRenderResult|null|undefined> => {
  const cacheResult = await (new PageCacheRepo().lookupCacheEntry({path: cacheKey, completeAbTestGroups: abTestGroups}));

  if (!cacheResult?.renderResult) {
    // eslint-disable-next-line no-console
    console.log(`DB cache miss for cacheKey ${cacheKey}: no cached page with this cacheKey and a valid A/B test group combination`);
    return null;
  }

  // eslint-disable-next-line no-console
  console.log(`DB cache hit for cacheKey ${cacheKey}`);
  return {
    ...cacheResult?.renderResult,
    aborted: false
  };
}

const cacheLookup = async (cacheKey: string, abTestGroups: CompleteTestGroupAllocation): Promise<CachedRenderResult|null|undefined> => {
  const localResult = cacheLookupLocal(cacheKey, abTestGroups);
  if (localResult) {
    return localResult;
  }

  if (dbPageCacheEnabledSetting.get()) {
    const dbResult = await cacheLookupDB(cacheKey, abTestGroups);
    return dbResult;
  }

  return null;
}

const objIsSubset = <A extends Record<string, any>, B extends Record<string, any>>(subset: A, superset: B): boolean => {
  for (let key in subset) {
    if (!(key in superset) || subset[key] !== superset[key as AnyBecauseHard])
      return false;
  }
  return true;
}

const cacheStoreLocal = (cacheKey: string, abTestGroups: RelevantTestGroupAllocation, rendered: CachedRenderResult): void => {
  pageCache.set(JSON.stringify({
    cacheKey: cacheKey,
    abTestGroups: abTestGroups
  }), rendered);
  
  if (cacheKey in cachedABtestsIndex)
    cachedABtestsIndex[cacheKey].push(abTestGroups);
  else
    cachedABtestsIndex[cacheKey] = [abTestGroups];
}

const cacheStoreDB = (cacheKey: string, abTestGroups: RelevantTestGroupAllocation, rendered: CachedRenderResult): void => {
  void new PageCacheRepo().upsertPageCacheEntry(cacheKey, abTestGroups, rendered);
}

const cacheStore = (cacheKey: string, abTestGroups: RelevantTestGroupAllocation, rendered: CachedRenderResult): void => {
  cacheStoreLocal(cacheKey, abTestGroups, rendered);
  cacheStoreDB(cacheKey, abTestGroups, rendered);
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

// export function recordDatadogCacheEvent(cacheEvent: {path: string, userAgent: string, type: "hit"|"miss"|"bypass"}) {
//   // Bots are _mostly_ already redirected by botRedirect.ts, so assume every request that is not a health check is a real user
//   const userType = cacheEvent.userAgent === healthCheckUserAgentSetting.get() ? "health_check" : "likely_real_user";

//   const expandedCacheEvent = {...cacheEvent, userType};
//   if (isDatadogEnabled && dogstatsd) {
//     dogstatsd.increment("cache_event", expandedCacheEvent)
//   }
// }

export function recordCacheHit(cacheEvent: {path: string, userAgent: string}) {
  // recordDatadogCacheEvent({...cacheEvent, type: "hit"}); // Useful for debugging, but expensive to track all the time
  cacheHits++;
  cacheQueriesTotal++;
}
export function recordCacheMiss(cacheEvent: {path: string, userAgent: string}) {
  // recordDatadogCacheEvent({...cacheEvent, type: "miss"}); // Useful for debugging, but expensive to track all the time
  cacheQueriesTotal++;
}
export function recordCacheBypass(cacheEvent: {path: string, userAgent: string}) {
  // recordDatadogCacheEvent({...cacheEvent, type: "bypass"}); // Useful for debugging, but expensive to track all the time
  cacheQueriesTotal++;
}
export function getCacheHitRate() {
  return cacheHits / cacheQueriesTotal;
}

export function printCacheState(options: any={}) {
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


export function printInFlightRequests() {
  let inProgressRenderKeys: string[] = [];
  for (let cacheKey of Object.keys(inProgressRenders)) {
    for (let render of inProgressRenders[cacheKey]) {
      inProgressRenderKeys.push(render.cacheKey);
    }
  }
  if (inProgressRenderKeys.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`In progress: ${inProgressRenderKeys.join(", ")}`);
  }
}
