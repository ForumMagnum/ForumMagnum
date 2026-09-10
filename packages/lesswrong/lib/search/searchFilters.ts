import { TupleSet, UnionOf } from "../utils/typeGuardUtils";

export const searchPostTypes = new TupleSet(["article", "question", "linkpost", "shortform", "event"] as const);
export type SearchPostType = UnionOf<typeof searchPostTypes>;

export const searchPostTypeLabels: Record<SearchPostType, string> = {
  article: "Articles",
  question: "Questions",
  linkpost: "Link posts",
  shortform: "Shortform",
  event: "Events",
};

export type SearchEventFilter = "include" | "exclude" | "only";
export type SearchTagMatch = "any" | "all";

/** The selectable non-event post types. Events have an independent control. */
export const defaultSearchPostTypes: SearchPostType[] = Array.from(searchPostTypes).filter(type => type !== "event");

/** Epoch milliseconds. An absent bound is open. */
export interface SearchDateRange {
  start?: number;
  end?: number;
}

export interface SearchKarmaRange {
  min?: number;
  max?: number;
}

export interface SearchFilterState {
  tagIds: string[];
  tagMatch: SearchTagMatch;
  events: SearchEventFilter;
  authorIds: string[];
  /** Empty means every post type. */
  postTypes: SearchPostType[];
  dateRange: SearchDateRange;
  karmaRange: SearchKarmaRange;
}

export const emptySearchFilters: SearchFilterState = {
  tagIds: [],
  tagMatch: "any",
  events: "include",
  authorIds: [],
  postTypes: [],
  dateRange: {},
  karmaRange: {},
};

/** The filter-related part of a search request, understood by the search API. */
export interface SearchFilterParams {
  facetFilters?: string[][];
  numericFilters?: string[];
  tagIds?: string[];
  tagMatch?: SearchTagMatch;
  authorIds?: string[];
  postTypes?: SearchPostType[];
}

function sameTypes(a: SearchPostType[], b: SearchPostType[]): boolean {
  return a.length === b.length && a.every(type => b.includes(type));
}

/** Post types affect posts only; events and tag matching are independent. */
export function searchFiltersToParams(filters: SearchFilterState): SearchFilterParams {
  const params: SearchFilterParams = {};
  const {tagIds, tagMatch, events, authorIds, postTypes, dateRange, karmaRange} = filters;
  if (tagIds.length) {
    params.tagIds = tagIds;
    params.tagMatch = tagMatch;
  }
  if (authorIds.length) params.authorIds = authorIds;
  if (events !== "include") params.facetFilters = [[events === "only" ? "isEvent:true" : "isEvent:-true"]];
  if (postTypes.length && !sameTypes(postTypes, defaultSearchPostTypes)) params.postTypes = postTypes;
  const numericFilters: string[] = [];
  if (dateRange.start !== undefined) numericFilters.push(`publicDateMs>=${dateRange.start}`);
  if (dateRange.end !== undefined) numericFilters.push(`publicDateMs<=${dateRange.end}`);
  if (karmaRange.min !== undefined) numericFilters.push(`karma>=${karmaRange.min}`);
  if (karmaRange.max !== undefined) numericFilters.push(`karma<=${karmaRange.max}`);
  if (numericFilters.length) params.numericFilters = numericFilters;
  return params;
}
