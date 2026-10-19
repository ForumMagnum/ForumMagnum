import qs from "qs";
import { SearchIndexCollectionName, collectionIsSearchIndexed } from "@/lib/search/searchUtil";
import {
  SearchDateRange,
  SearchFilterState,
  SearchPostType,
  defaultSearchPostTypes,
  emptySearchFilters,
  searchPostTypes,
} from "@/lib/search/searchFilters";

export interface SearchPageState {
  query: string;
  kinds: SearchIndexCollectionName[];
  filters: SearchFilterState;
  expandedFilters: string[];
  mobileFiltersOpen: boolean;
}

export const defaultSearchPageState: SearchPageState = {
  query: "",
  expandedFilters: ["time", "authors", "tags", "events", "types"],
  mobileFiltersOpen: false,
  kinds: [],
  filters: {...emptySearchFilters, postTypes: defaultSearchPostTypes, events: "exclude"},
};

const searchFilterPanels = new Set(["time", "authors", "tags", "events", "types"]);
const searchParameterNames = ["query", "kinds", "contentType", "tags", "tagMatch", "events", "authors", "types", "from", "to", "expanded", "mobileFilters"];

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

const dayMs = 24 * 60 * 60 * 1000;

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

function splitList(value: string | undefined): string[] {
  return value ? value.split(",").filter(item => item.length > 0) : [];
}

function parseIsoDay(value: string | undefined): number | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const ms = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value ? ms : undefined;
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

function samePostTypes(a: SearchPostType[], b: SearchPostType[]): boolean {
  return a.length === b.length && a.every(type => b.includes(type));
}

export function searchPageStateFromQuery(query: Record<string, string | undefined>): SearchPageState {
  const kinds = splitList(query.kinds ?? query.contentType).filter(collectionIsSearchIndexed);
  const postTypes = splitList(query.types).filter((type): type is SearchPostType => searchPostTypes.has(type));
  return {
    query: query.query ?? "",
    expandedFilters: query.expanded === undefined ? [...defaultSearchPageState.expandedFilters] : [...new Set(splitList(query.expanded).filter(key => searchFilterPanels.has(key)))],
    mobileFiltersOpen: query.mobileFilters === "1",
    kinds,
    filters: {
      tagIds: readList(query, "tags"),
      tagMatch: query.tagMatch === "all" ? "all" : "any",
      events: query.events === "include" || query.events === "only" || query.events === "exclude"
        ? query.events
        : postTypes.includes("event") ? postTypes.length === 1 ? "only" : "include" : "exclude",
      authorIds: readList(query, "authors"),
      postTypes: postTypes.some(type => type !== "event") ? postTypes.filter(type => type !== "event") : defaultSearchPostTypes,
      dateRange: parseDateRange(query.from, query.to),
    },
  };
}

export function searchPageStateToQuery(state: SearchPageState): Record<string, string> {
  const {filters} = state;
  const entries: [string, string | undefined][] = [
    ["query", state.query || undefined],
    ["expanded", state.expandedFilters.length === searchFilterPanels.size && state.expandedFilters.every(key => searchFilterPanels.has(key)) ? undefined : state.expandedFilters.join(",")],
    ["mobileFilters", state.mobileFiltersOpen ? "1" : undefined],
    ["kinds", state.kinds.length ? state.kinds.join(",") : undefined],
    ["tags", filters.tagIds.length ? filters.tagIds.join(",") : undefined],
    ["tagMatch", filters.tagMatch === "all" ? "all" : undefined],
    ["events", filters.events === "exclude" ? undefined : filters.events],
    ["authors", filters.authorIds.length ? filters.authorIds.join(",") : undefined],
    ["types", samePostTypes(filters.postTypes, defaultSearchPostTypes) ? undefined : filters.postTypes.join(",")],
    ["from", filters.dateRange.start !== undefined ? formatDateBound(filters.dateRange.start, false) : undefined],
    ["to", filters.dateRange.end !== undefined ? formatDateBound(filters.dateRange.end, true) : undefined],
  ];
  const result: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (value !== undefined) result[key] = value;
  }
  return result;
}

export function searchPageLink(query: string, kinds: SearchIndexCollectionName[]): string {
  return `/search?${qs.stringify({query, ...(kinds.length ? {kinds: kinds.join(",")} : {})})}`;
}
