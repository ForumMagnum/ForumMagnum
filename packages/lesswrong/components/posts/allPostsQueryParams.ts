import moment from '@/lib/moment-timezone';
import { filters } from '@/lib/collections/posts/constants';
import { POST_SORTING_MODES } from '@/lib/collections/posts/views';
import { timeframeSettings } from './timeframeUtils';

type SearchParamValue = string | string[] | undefined;

const allowedValuesByParam: Record<string, readonly string[]> = {
  sortedBy: [...POST_SORTING_MODES],
  timeframe: timeframeSettings,
  filter: Object.keys(filters),
};

const dateParams = ["after", "before"];

// Empty values count as absent, since AllPostsPage falls back to defaults for
// them. Repeated parameters (which arrive as arrays) are invalid.
function isAllowedValue(value: SearchParamValue, allowedValues: readonly string[]): boolean {
  return !value || (typeof value === "string" && allowedValues.includes(value));
}

function isValidDate(value: SearchParamValue): boolean {
  return !value || (typeof value === "string" && moment.utc(value, "YYYY-MM-DD", true).isValid());
}

/**
 * Checks the query parameters of /allPosts for values the page can't handle,
 * returning an error message for the first invalid one, or null if they're all
 * valid. Invalid values mostly come from scrapers that mangle the parameters of
 * valid URLs; rejecting them up front gives those requests a 400 instead of a
 * client-side crash.
 */
export function getAllPostsQueryParamsError(searchParams: Record<string, SearchParamValue>): string|null {
  for (const [param, allowedValues] of Object.entries(allowedValuesByParam)) {
    if (!isAllowedValue(searchParams[param], allowedValues)) {
      return `Invalid value for "${param}". Expected one of: ${allowedValues.join(", ")}.`;
    }
  }
  for (const param of dateParams) {
    if (!isValidDate(searchParams[param])) {
      return `Invalid value for "${param}". Expected a date in YYYY-MM-DD format.`;
    }
  }
  // The timeframe lists can't render a date range that ends before it starts
  const { after, before } = searchParams;
  if (typeof after === "string" && typeof before === "string" && after && before
    && moment.utc(after).isAfter(moment.utc(before))
  ) {
    return `"after" must not be later than "before".`;
  }
  return null;
}
