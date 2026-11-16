import { TupleSet, UnionOf } from "../utils/typeGuardUtils";

export const searchPostTypes = new TupleSet(["article", "question", "linkpost", "event"] as const);
export type SearchPostType = UnionOf<typeof searchPostTypes>;

export const searchPostTypeLabels: Record<SearchPostType, string> = {
  article: "Articles",
  question: "Questions",
  linkpost: "Link posts",
  event: "Events",
};

export type SearchEventFilter = "include" | "exclude" | "only";
export type SearchTagMatch = "any" | "all";

export const defaultSearchPostTypes: SearchPostType[] = Array.from(searchPostTypes).filter(type => type !== "event");

export const searchDatePeriods = new TupleSet(["day", "week", "month", "year"] as const);
export type SearchDatePeriod = UnionOf<typeof searchDatePeriods>;

const searchDatePeriodDays: Record<SearchDatePeriod, number> = {day: 1, week: 7, month: 30, year: 365};

/**
 * Either a relative period (the presets), resolved against the clock when the
 * search is sent, or an absolute range in epoch milliseconds.
 */
export interface SearchDateRange {
  past?: SearchDatePeriod;
  start?: number;
  end?: number;
}

export function hasSearchDateRange(range: SearchDateRange): boolean {
  return range.past !== undefined || range.start !== undefined || range.end !== undefined;
}

export interface SearchFilterState {
  tagIds: string[];
  tagMatch: SearchTagMatch;
  events: SearchEventFilter;
  authorIds: string[];
  postTypes: SearchPostType[];
  dateRange: SearchDateRange;
}

export const emptySearchFilters: SearchFilterState = {
  tagIds: [],
  tagMatch: "any",
  events: "include",
  authorIds: [],
  postTypes: [],
  dateRange: {},
};

export interface SearchFilterParams {
  facetFilters?: string[][];
  numericFilters?: string[];
  tagIds?: string[];
  tagMatch?: SearchTagMatch;
  authorIds?: string[];
  postTypes?: SearchPostType[];
  /** Only match documents published in this many milliseconds before the request */
  withinMs?: number;
}

export function isDefaultSearchPostTypes(types: SearchPostType[]): boolean {
  return types.length === defaultSearchPostTypes.length && types.every(type => defaultSearchPostTypes.includes(type));
}

export function searchFiltersToParams(filters: SearchFilterState): SearchFilterParams {
  const params: SearchFilterParams = {};
  const {tagIds, tagMatch, events, authorIds, postTypes, dateRange} = filters;
  if (tagIds.length) {
    params.tagIds = tagIds;
    params.tagMatch = tagMatch;
  }
  if (authorIds.length) params.authorIds = authorIds;
  if (events !== "include") params.facetFilters = [[events === "only" ? "isEvent:true" : "isEvent:-true"]];
  if (postTypes.length && !isDefaultSearchPostTypes(postTypes)) params.postTypes = postTypes;
  const numericFilters: string[] = [];
  if (dateRange.start !== undefined) numericFilters.push(`publicDateMs>=${dateRange.start}`);
  if (dateRange.end !== undefined) numericFilters.push(`publicDateMs<=${dateRange.end}`);
  if (numericFilters.length) params.numericFilters = numericFilters;
  if (dateRange.past !== undefined) params.withinMs = searchDatePeriodDays[dateRange.past] * 24 * 60 * 60 * 1000;
  return params;
}
