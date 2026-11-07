import type { SortCombinations } from "@elastic/elasticsearch/lib/api/types";

// Relevance first; date only breaks exact score ties.
export const searchSort: SortCombinations[] = [
  {_score: {order: "desc"}},
  {publicDateMs: {order: "desc", missing: "_last", unmapped_type: "long"}},
  {objectID: "asc"},
  {_index: "asc"},
];
