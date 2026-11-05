import type { SortCombinations } from "@elastic/elasticsearch/lib/api/types";

const karmaSortScript = `
  String field = doc.containsKey('karma') ? 'karma' : 'baseScore';
  if (!doc.containsKey(field) || doc[field].size() == 0) return 0;
  return doc[field].value;
`;

const commentsSortScript = `
  if (!doc['_index'].value.startsWith('posts')) return 0;
  if (!doc.containsKey('commentCount') || doc['commentCount'].size() == 0) return 0;
  return doc['commentCount'].value;
`;

// Relevance first; date, karma, and comments only break exact score ties.
export const searchSort: SortCombinations[] = [
  {_score: {order: "desc"}},
  {publicDateMs: {order: "desc", missing: "_last", unmapped_type: "long"}},
  {_script: {type: "number", order: "desc", script: {source: karmaSortScript}}},
  {_script: {type: "number", order: "desc", script: {source: commentsSortScript}}},
  {objectID: "asc"},
  {_index: "asc"},
];
