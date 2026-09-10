import { TupleSet, UnionOf } from "../utils/typeGuardUtils";

/**
 * Exact sort keys for unified multi-index search, in priority order.
 * Later keys only break ties in earlier keys; object id and index ensure
 * stable ordering when all selected values are equal.
 */
export const searchSortKeys = new TupleSet(["relevance", "date", "karma", "comments"] as const);
export type SearchSortKey = UnionOf<typeof searchSortKeys>;
export type SearchSortDirection = "asc" | "desc";

export interface SearchSortSpec {
  key: SearchSortKey;
  direction: SearchSortDirection;
}

export const searchSortLabels: Record<SearchSortKey, string> = {
  relevance: "Relevance",
  date: "Date",
  karma: "Karma",
  comments: "Comments",
};

export const defaultSearchSort: SearchSortSpec[] = Array.from(searchSortKeys).map(key => ({key, direction: "desc"}));

const invalid = (value: string) => new Error(`Invalid search sort: ${value}`);

function parseSpec(value: string): SearchSortSpec {
  const [key, direction, extra] = value.split(":");
  if (extra !== undefined) throw invalid(value);
  if (!searchSortKeys.has(key)) throw invalid(value);
  if (direction !== "asc" && direction !== "desc") throw invalid(value);
  return {key, direction};
}

/** Request form: one "key:direction" string per sort key, in priority order. */
export function formatSearchSort(specs: SearchSortSpec[]): string[] {
  return specs.map(spec => `${spec.key}:${spec.direction}`);
}

/** Strict parse of the request form. Throws on anything the server should not guess about. */
export function parseSearchSort(values: string[]): SearchSortSpec[] {
  if (!values.length) throw invalid("(empty)");
  const specs = values.map(parseSpec);
  const keys = new Set(specs.map(spec => spec.key));
  if (keys.size !== specs.length) throw invalid(values.join(","));
  return specs;
}

function isDefaultSort(specs: SearchSortSpec[]): boolean {
  return specs.length === defaultSearchSort.length
    && specs.every((spec, index) => spec.key === defaultSearchSort[index].key && spec.direction === defaultSearchSort[index].direction);
}

export function searchSortToUrlParam(specs: SearchSortSpec[]): string | undefined {
  return isDefaultSort(specs) ? undefined : formatSearchSort(specs).join(",");
}

/** Lenient parse of user-editable URL state: anything malformed yields the default sort. */
export function searchSortFromUrlParam(param: string | undefined): SearchSortSpec[] {
  if (!param) return defaultSearchSort;
  let specs: SearchSortSpec[];
  try {
    specs = parseSearchSort(param.split(","));
  } catch {
    return defaultSearchSort;
  }
  const missing = defaultSearchSort.filter(spec => !specs.some(given => given.key === spec.key));
  return [...specs, ...missing];
}

export function moveSearchSort(specs: SearchSortSpec[], fromKey: SearchSortKey, toKey: SearchSortKey): SearchSortSpec[] {
  const fromIndex = specs.findIndex(spec => spec.key === fromKey);
  const toIndex = specs.findIndex(spec => spec.key === toKey);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return specs;
  const result = specs.slice();
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}

export function toggleSearchSortDirection(specs: SearchSortSpec[], key: SearchSortKey): SearchSortSpec[] {
  return specs.map(spec => spec.key === key
    ? {...spec, direction: spec.direction === "desc" ? "asc" : "desc"}
    : spec);
}
