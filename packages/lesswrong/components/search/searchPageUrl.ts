import { SearchIndexCollectionName, collectionIsSearchIndexed } from "@/lib/search/searchUtil";
import {
  SearchDateRange,
  SearchFilterState,
  searchDatePeriods,
  SearchEventFilter,
  SearchPostType,
  defaultSearchFilters,
  defaultSearchPostTypes,
  isDefaultSearchPostTypes,
  maxSearchFilterIds,
  searchEventFilters,
  searchPostTypes,
} from "@/lib/search/searchFilters";
import pickBy from "lodash/pickBy";

/** What a search URL holds: the search itself, not how its page is laid out */
export interface SearchPageState {
  query: string;
  kinds: SearchIndexCollectionName[];
  filters: SearchFilterState;
}

const searchParameterNames = ["query", "search", "kinds", "contentType", "tags", "tagMatch", "events", "authors", "types", "past", "from", "to"];

export const searchModalOpenParam = "searchOpen";

export function isSearchModalOpen(search: string): boolean {
  return new URLSearchParams(search).get(searchModalOpenParam) === "1";
}

export function mergeSearchPageParams(search: string, state: SearchPageState, presentation: "page" | "modal" = "page"): string {
  const prefix = presentation === "modal" ? "search." : "";
  const params = new URLSearchParams(search);
  for (const key of [...params.keys()]) {
    if (!key.startsWith(prefix)) continue;
    const name = key.slice(prefix.length).replace(/\[\d*\]$/, "");
    if (searchParameterNames.includes(name)) params.delete(key);
  }
  const query = searchPageStateToQuery(state);
  for (const [key, value] of Object.entries(query)) params.set(`${prefix}${key}`, value);
  return params.toString();
}

export function searchPageStateFromSearch(search: string, presentation: "page" | "modal"): SearchPageState {
  const prefix = presentation === "modal" ? "search." : "";
  const query: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(search)) {
    if (key.startsWith(prefix)) query[key.slice(prefix.length)] = value;
  }
  return searchPageStateFromQuery(query);
}

function readList(query: Record<string, string | undefined>, key: string): string[] {
  if (query[key] !== undefined) return splitList(query[key]);
  return Object.entries(query)
    .filter(([name]) => name.startsWith(`${key}[`) && /^\[\d*\]$/.test(name.slice(key.length)))
    .sort(([a], [b]) => Number(a.slice(key.length + 1, -1)) - Number(b.slice(key.length + 1, -1)))
    .flatMap(([, value]) => splitList(value));
}

function readIdList(query: Record<string, string | undefined>, key: string): string[] {
  return [...new Set(readList(query, key))].slice(0, maxSearchFilterIds);
}

function splitList(value: string | undefined): string[] {
  return value ? value.split(",").filter(item => item.length > 0) : [];
}

/** The time of day a bound given as a bare day stands for */
const dayBoundSuffix = (end: boolean) => end ? "T23:59:59.999Z" : "T00:00:00.000Z";

function parseDateBound(value: string | undefined, end: boolean): number | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}\.\d{3}Z)?$/.test(value)) return undefined;
  const iso = value.length === 10 ? value + dayBoundSuffix(end) : value;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) && new Date(ms).toISOString() === iso ? ms : undefined;
}

function formatDateBound(ms: number, end: boolean): string {
  const iso = new Date(ms).toISOString();
  return iso.endsWith(dayBoundSuffix(end)) ? iso.slice(0, 10) : iso;
}

function parseDateRange(past: string | undefined, from: string | undefined, to: string | undefined): SearchDateRange {
  if (past !== undefined && searchDatePeriods.has(past)) return {past};
  const start = parseDateBound(from, false);
  const end = parseDateBound(to, true);
  if (start !== undefined && end !== undefined && start > end) return {};
  return {...(start !== undefined ? {start} : {}), ...(end !== undefined ? {end} : {})};
}

function parseEventFilter(value: string | undefined): SearchEventFilter {
  return value !== undefined && searchEventFilters.has(value) ? value : defaultSearchFilters.events;
}

function searchPageStateFromQuery(query: Record<string, string | undefined>): SearchPageState {
  const kinds = splitList(query.kinds ?? query.contentType).filter(collectionIsSearchIndexed);
  const postTypes = splitList(query.types).filter((type): type is SearchPostType => searchPostTypes.has(type));
  return {
    query: query.query ?? query.search ?? "",
    kinds,
    filters: {
      tagIds: readIdList(query, "tags"),
      tagMatch: query.tagMatch === "all" ? "all" : "any",
      events: parseEventFilter(query.events),
      authorIds: readIdList(query, "authors"),
      postTypes: postTypes.length ? postTypes : defaultSearchPostTypes,
      dateRange: parseDateRange(query.past, query.from, query.to),
    },
  };
}

export function searchPageStateToQuery(state: SearchPageState): Record<string, string> {
  const {filters} = state;
  return pickBy({
    query: state.query,
    kinds: state.kinds.join(","),
    tags: filters.tagIds.join(","),
    tagMatch: filters.tagMatch === "all" ? "all" : undefined,
    events: filters.events === defaultSearchFilters.events ? undefined : filters.events,
    authors: filters.authorIds.join(","),
    types: isDefaultSearchPostTypes(filters.postTypes) ? undefined : filters.postTypes.join(","),
    past: filters.dateRange.past,
    from: filters.dateRange.start !== undefined ? formatDateBound(filters.dateRange.start, false) : undefined,
    to: filters.dateRange.end !== undefined ? formatDateBound(filters.dateRange.end, true) : undefined,
  }, (value): value is string => !!value);
}
