// Note: this file is modified by the `create-collection` codegen script.
// Keep that in mind if changing the structure.

// Helper imports
import { SqlFragment } from '@/server/sql/SqlFragment';
import type { DocumentNode, FragmentDefinitionNode } from 'graphql';
import uniq from 'lodash/uniq';
import { isAnyTest } from '../executionEnvironment';
import LRU from "lru-cache";
import { TypedDocumentNode } from '@apollo/client';
import { print } from 'graphql';
import { transformFragments } from './fragmentWrapper';
import mapValues from 'lodash/mapValues';
import gql from 'graphql-tag';

// Generated default fragments
import * as defaultFragments from '@/lib/generated/defaultFragments';

// Unfortunately the inversion with sql fragment compilation is a bit tricky to unroll, so for now we just dynamically load the test fragments if we're in a test environment.
// We type this as Record<never, never> because we want to avoid it clobbering the rest of the fragment types.
// TODO: does this need fixing to avoid esbuild headaches?  I think no, but could be risky in the future.
let testFragments: Record<never, never>;
if (isAnyTest) {
  testFragments = mapValues(require('../../server/sql/tests/testFragments'), (v) => gql`${v}`);
} else {
  testFragments = {};
}

interface FragmentDefinition {
  fragmentText: string
  subFragments?: Array<FragmentName>
  fragmentObject?: DocumentNode
}

const memoizedFragmentInfo: Partial<Record<FragmentName, FragmentDefinition>> = {};

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

// Register a fragment, including its text, the text of its subfragments, and the fragment object
function registerFragment(fragmentTextSource: string): FragmentDefinition {
  // remove comments
  const fragmentText = fragmentTextSource.replace(/#.*\n/g, '\n');

  // extract subFragments from text
  const subFragments  = getSubfragmentNamesIn(fragmentText);

  const fragmentDefinition: FragmentDefinition = {
    fragmentText,
  };

  if (subFragments && subFragments.length) {
    fragmentDefinition.subFragments = subFragments as Array<FragmentName>;
  }

  return fragmentDefinition;
}

export function getMemoizedFragmentInfo(fragmentName: FragmentName): FragmentDefinition {
  let fragmentDefinition = memoizedFragmentInfo[fragmentName];
  if (!fragmentDefinition) {
    fragmentDefinition = registerFragment(getAllFragments()[fragmentName]);
    memoizedFragmentInfo[fragmentName] = fragmentDefinition;
  }

  return fragmentDefinition;
}
