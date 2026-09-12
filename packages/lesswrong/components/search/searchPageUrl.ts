import qs from "qs";
import { parseIsoDay } from "./timeframeSlider";
import { SearchIndexCollectionName, collectionIsSearchIndexed } from "@/lib/search/searchUtil";
import { SearchSortSpec, searchSortFromUrlParam, searchSortToUrlParam } from "@/lib/search/searchSorting";
import {
  SearchDateRange,
  SearchFilterState,
  SearchKarmaRange,
  SearchPostType,
  defaultSearchPostTypes,
  emptySearchFilters,
  searchPostTypes,
} from "@/lib/search/searchFilters";

export interface SearchPageState {
  query: string;
  /** Empty means every kind. */
  kinds: SearchIndexCollectionName[];
  sort: SearchSortSpec[];
  filters: SearchFilterState;
  expandedFilters: string[];
  /** Controls the whole filter drawer; the name preserves the existing URL format. */
  mobileFiltersOpen: boolean;
}

export const defaultSearchPageState: SearchPageState = {
  query: "",
  expandedFilters: ["time", "authors", "tags", "events", "types", "karma"],
  mobileFiltersOpen: false,
  kinds: [],
  sort: searchSortFromUrlParam(undefined),
  filters: {...emptySearchFilters, postTypes: defaultSearchPostTypes, events: "exclude"},
};

const searchFilterPanels = new Set(["time", "authors", "tags", "events", "types", "karma"]);
const searchParameterNames = ["query", "kinds", "contentType", "sort", "tags", "tagMatch", "events", "authors", "types", "from", "to", "karma", "expanded", "mobileFilters"];

/** Preserve unrelated parameters, including repeated values, while replacing search state. */
export function mergeSearchPageParams(search: string, state: SearchPageState): string {
  const params = new URLSearchParams(search);
  for (const key of searchParameterNames) params.delete(key);
  const query = searchPageStateToQuery(state);
  for (const [key, value] of Object.entries(query)) params.set(key, value);
  return params.toString();
}

const dayMs = 24 * 60 * 60 * 1000;
const karmaPattern = /^(-?\d+)?-(-?\d+)?$/;

function splitList(value: string | undefined): string[] {
  return value ? value.split(",").filter(item => item.length > 0) : [];
}

function parseDateBound(value: string | undefined, end: boolean): number | undefined {
  const day = parseIsoDay(value);
  if (day !== undefined) return day + (end ? dayMs - 1 : 0);
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return undefined;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value ? ms : undefined;
}

function formatDateBound(ms: number, end: boolean): string {
  const iso = new Date(ms).toISOString();
  return iso.endsWith(end ? "T23:59:59.999Z" : "T00:00:00.000Z") ? iso.slice(0, 10) : iso;
}

function parseDateRange(from: string | undefined, to: string | undefined): SearchDateRange {
  const start = parseDateBound(from, false);
  const end = parseDateBound(to, true);
  if (start !== undefined && end !== undefined && start > end) return {};
  return {...(start !== undefined ? {start} : {}), ...(end !== undefined ? {end} : {})};
}

function parseKarmaRange(value: string | undefined): SearchKarmaRange {
  const match = value ? karmaPattern.exec(value) : null;
  if (!match) return {};
  const range: SearchKarmaRange = {};
  if (match[1] !== undefined) range.min = Number(match[1]);
  if (match[2] !== undefined) range.max = Number(match[2]);
  if (Object.values(range).some(bound => !Number.isSafeInteger(bound))) return {};
  if (range.min !== undefined && range.max !== undefined && range.min > range.max) return {};
  return range;
}

function formatKarmaRange(range: SearchKarmaRange): string | undefined {
  if (range.min === undefined && range.max === undefined) return undefined;
  return `${range.min ?? ""}-${range.max ?? ""}`;
}

function samePostTypes(a: SearchPostType[], b: SearchPostType[]): boolean {
  return a.length === b.length && a.every(type => b.includes(type));
}

/** Reads user-editable URL state. Unknown values are dropped, never guessed. */
export function searchPageStateFromQuery(query: Record<string, string | undefined>): SearchPageState {
  const kinds = splitList(query.kinds ?? query.contentType).filter(collectionIsSearchIndexed);
  const postTypes = splitList(query.types).filter((type): type is SearchPostType => searchPostTypes.has(type));
  return {
    query: query.query ?? "",
    expandedFilters: query.expanded === undefined ? [...defaultSearchPageState.expandedFilters] : [...new Set(splitList(query.expanded).filter(key => searchFilterPanels.has(key)))],
    mobileFiltersOpen: query.mobileFilters === "1",
    kinds,
    sort: searchSortFromUrlParam(query.sort),
    filters: {
      tagIds: splitList(query.tags),
      tagMatch: query.tagMatch === "all" ? "all" : "any",
      events: query.events === "include" || query.events === "only" || query.events === "exclude"
        ? query.events
        : postTypes.includes("event") ? postTypes.length === 1 ? "only" : "include" : "exclude",
      authorIds: splitList(query.authors),
      postTypes: postTypes.some(type => type !== "event") ? postTypes.filter(type => type !== "event") : defaultSearchPostTypes,
      dateRange: parseDateRange(query.from, query.to),
      karmaRange: parseKarmaRange(query.karma),
    },
  };
}

/** Writes only what differs from the default so links stay short. */
export function searchPageStateToQuery(state: SearchPageState): Record<string, string> {
  const {filters} = state;
  const entries: [string, string | undefined][] = [
    ["query", state.query || undefined],
    ["expanded", state.expandedFilters.length === searchFilterPanels.size && state.expandedFilters.every(key => searchFilterPanels.has(key)) ? undefined : state.expandedFilters.join(",")],
    ["mobileFilters", state.mobileFiltersOpen ? "1" : undefined],
    ["kinds", state.kinds.length ? state.kinds.join(",") : undefined],
    ["sort", searchSortToUrlParam(state.sort)],
    ["tags", filters.tagIds.length ? filters.tagIds.join(",") : undefined],
    ["tagMatch", filters.tagMatch === "all" ? "all" : undefined],
    ["events", filters.events === "exclude" ? undefined : filters.events],
    ["authors", filters.authorIds.length ? filters.authorIds.join(",") : undefined],
    ["types", samePostTypes(filters.postTypes, defaultSearchPostTypes) ? undefined : filters.postTypes.join(",")],
    ["from", filters.dateRange.start !== undefined ? formatDateBound(filters.dateRange.start, false) : undefined],
    ["to", filters.dateRange.end !== undefined ? formatDateBound(filters.dateRange.end, true) : undefined],
    ["karma", formatKarmaRange(filters.karmaRange)],
  ];
  const result: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (value !== undefined) result[key] = value;
  }
  return result;
}

/** Shared by sidebar form submission and the advanced-search link. */
export function searchPageLink(query: string, kinds: SearchIndexCollectionName[]): string {
  return `/search?${qs.stringify({query, ...(kinds.length ? {kinds: kinds.join(",")} : {})})}`;
}
