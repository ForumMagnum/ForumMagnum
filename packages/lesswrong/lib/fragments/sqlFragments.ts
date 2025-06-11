// Helper imports
import { SqlFragment } from '@/server/sql/SqlFragment';
import uniq from 'lodash/uniq';
import LRU from "lru-cache";

const sqlFragmentCache = new LRU<string, SqlFragment>({
  max: 5_000_000,
  // Rough estimate that a SQL Fragment is 3x the size of the fragment text, plus the fragment text itself as the key
  // I'm not sure how the key might be missing, but empirically our queries end up measuring at about 10kb
  length: (_, key) => !key ? 10_000 : key.length * 4,
});

export function getSubfragmentNamesIn(fragmentText: string): string[] {
  const matchedSubFragments = fragmentText.match(/\.{3}([_A-Za-z][_0-9A-Za-z]*)/g) || [];
  return uniq(matchedSubFragments.map(f => f.replace('...', '')));
}

export function getSqlFragment(fragmentName: string, fragmentText: string): SqlFragment {
  // Remove comments from the fragment source text
  fragmentText = fragmentText.replace(/#.*\n/g, '\n');

  const cached = sqlFragmentCache.get(fragmentText);
  if (cached) {
    return cached;
  }
  const sqlFragment = new SqlFragment(fragmentName, fragmentText);
  sqlFragmentCache.set(fragmentText, sqlFragment);
  return sqlFragment;
}
