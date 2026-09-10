import type { Sort, SortCombinations } from "@elastic/elasticsearch/lib/api/types";
import type { SearchSortSpec } from "@/lib/search/searchSorting";

/** Users keep karma in 'karma'; every other index keeps it in 'baseScore'. */
export const karmaSortScript = `
  String field = doc.containsKey('karma') ? 'karma' : 'baseScore';
  if (!doc.containsKey(field) || doc[field].size() == 0) return 0;
  return doc[field].value;
`;

/** Only posts count comments on the document. Users' commentCount means something else. */
export const commentsSortScript = `
  if (!doc['_index'].value.startsWith('posts')) return 0;
  if (!doc.containsKey('commentCount') || doc['commentCount'].size() == 0) return 0;
  return doc['commentCount'].value;
`;

const stableTiebreakers: SortCombinations[] = [{objectID: "asc"}, {_index: "asc"}];

function compileSortKey({key, direction}: SearchSortSpec): SortCombinations {
  switch (key) {
    case "relevance": return {_score: {order: direction}};
    case "date": return {publicDateMs: {order: direction, missing: "_last", unmapped_type: "long"}};
    case "karma": return {_script: {type: "number", order: direction, script: {source: karmaSortScript}}};
    case "comments": return {_script: {type: "number", order: direction, script: {source: commentsSortScript}}};
  }
}

/** Exact values in priority order: subsequent keys only break ties. */
export function compileUnifiedSort(sort: SearchSortSpec[] | undefined): Sort {
  const specs: SearchSortSpec[] = sort ?? [{key: "relevance", direction: "desc"}];
  return [...specs.map(compileSortKey), ...stableTiebreakers];
}
