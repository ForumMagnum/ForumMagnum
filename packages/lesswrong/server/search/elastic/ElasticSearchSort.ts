import type { Sort, SortCombinations } from "@elastic/elasticsearch/lib/api/types";

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

// Relevance first; date, karma, and comments break ties, which matters for
// empty queries where every hit scores the same.
const searchSort: SortCombinations[] = [
  {_score: {order: "desc"}},
  {publicDateMs: {order: "desc", missing: "_last", unmapped_type: "long"}},
  {_script: {type: "number", order: "desc", script: {source: karmaSortScript}}},
  {_script: {type: "number", order: "desc", script: {source: commentsSortScript}}},
  {objectID: "asc"},
  {_index: "asc"},
];

export function compileSearchSort(curatedSequenceIds: string[] = []): Sort {
  const curatedFirst: SortCombinations[] = curatedSequenceIds.length ? [{_script: {
    type: "number", order: "desc", script: {
      source: "return doc['_index'].value.startsWith('sequences') && params.ids.contains(doc['objectID'].value) ? 1 : 0;",
      params: {ids: curatedSequenceIds},
    },
  }}] : [];
  return [...curatedFirst, ...searchSort];
}
