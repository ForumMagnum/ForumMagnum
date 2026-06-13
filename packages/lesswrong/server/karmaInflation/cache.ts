import { DatabaseMetadata } from "../collections/databaseMetadata/collection";
import { nullKarmaInflationSeries, TimeSeries } from "../../lib/collections/posts/karmaInflation";

const KARMA_INFLATION_CACHE_TTL_MS = 60 * 60 * 1000;
let cachedSeries: TimeSeries = nullKarmaInflationSeries;
let cacheExpiresAt = 0;
let pendingFetch: Promise<TimeSeries> | null = null;

async function fetchKarmaInflationSeries(): Promise<TimeSeries> {
  try {
    const metadata = await DatabaseMetadata.findOne({ name: "karmaInflationSeries" });
    cachedSeries = metadata?.value ?? nullKarmaInflationSeries;
    cacheExpiresAt = Date.now() + KARMA_INFLATION_CACHE_TTL_MS;
    return cachedSeries;
  } finally {
    pendingFetch = null;
  }
}

/**
 * The karma inflation series is recomputed nightly (see refreshKarmaInflation)
 * and stored in DatabaseMetadata; here we fetch it on demand and cache it
 * in memory per server instance.
 */
export function getKarmaInflationSeries(): TimeSeries | Promise<TimeSeries> {
  if (Date.now() < cacheExpiresAt) {
    return cachedSeries;
  }
  if (!pendingFetch) {
    pendingFetch = fetchKarmaInflationSeries();
  }
  return pendingFetch;
}
