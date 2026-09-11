import type { TimeSeries } from "../../../lib/collections/posts/karmaInflation";

export function getKarmaInflationSeries(): TimeSeries | Promise<TimeSeries> {
  throw new Error("getKarmaInflationSeries can only be run on the server");
}
