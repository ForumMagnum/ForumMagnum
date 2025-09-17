// Helper imports
import { createSqlFragmentFromAst, ParsedSqlFragment } from '@/server/sql/SqlFragment';
import { FragmentDefinitionNode } from 'graphql';
import uniq from 'lodash/uniq';
import LRU from "lru-cache";
import stringify from "json-stringify-deterministic";


const sqlFragmentCache = new LRU<string, ParsedSqlFragment>({
  max: 5_000_000,
  // Rough estimate that a SQL Fragment is 3x the size of the fragment text, plus the fragment text itself as the key
  // I'm not sure how the key might be missing, but empirically our queries end up measuring at about 10kb
  length: (_, key) => !key ? 10_000 : key.length * 4,
});

export function getSubfragmentNamesIn(fragmentText: string): string[] {
  const matchedSubFragments = fragmentText.match(/\.{3}([_A-Za-z][_0-9A-Za-z]*)/g) || [];
  return uniq(matchedSubFragments.map(f => f.replace('...', '')));
}

export function getSqlFragment(fragmentName: string, fragmentDefinitions: FragmentDefinitionNode[]): ParsedSqlFragment {
  const fragmentText = stringify(fragmentDefinitions);

  const cached = sqlFragmentCache.get(fragmentText);
  if (cached) {
    return cached;
  }
  
  const sqlFragment = createSqlFragmentFromAst(fragmentName, fragmentDefinitions);
  sqlFragmentCache.set(fragmentText, sqlFragment);
  return sqlFragment;
}
