import type { DocumentNode } from 'graphql';
import { getMemoizedFragmentInfo } from '../fragments/allFragments';
import gql from 'graphql-tag';

// Get fragment name from fragment object
export function getFragmentName(fragment: AnyBecauseTodo) {
  return fragment && fragment.definitions[0] && fragment.definitions[0].name.value;
}

/**
 * WARNING: This doesn't include the subfragments, so it's not a full fragment definition.
 * Don't use this for anything that requires the subfragments
 */
export function getFragmentText(fragmentName: FragmentName): string {
  if (!getMemoizedFragmentInfo(fragmentName)) {
    throw new Error(`Fragment "${fragmentName}" not registered.`);
  }
  // return fragment object created by gql
  return getMemoizedFragmentInfo(fragmentName).fragmentText;  
}

export function getFragmentByName(fragmentName: FragmentName): DocumentNode {
  return gql(getFragmentText(fragmentName));
}

function addFragmentDependencies(fragments: Array<FragmentName>): Array<FragmentName> {
  const result = [...fragments];
  for (let i=0; i<result.length; i++) {
    const dependencies = getMemoizedFragmentInfo(result[i]).subFragments;
    if (dependencies) {
      dependencies.forEach((subfragment: FragmentName) => {
        if (!result.find((s: FragmentName)=>s===subfragment))
          result.push(subfragment);
      });
    }
  }
  return result;
}

// Given a fragment name (or an array of fragment names), return text which can
// be added to a graphql query to define that fragment (or fragments) and its
// (or their) dependencies.
export function fragmentTextForQuery(fragmentOrFragments: FragmentName|Array<FragmentName>): string {
  const rootFragments: Array<FragmentName> = Array.isArray(fragmentOrFragments) ? fragmentOrFragments : [fragmentOrFragments];
  const fragmentsUsed = addFragmentDependencies(rootFragments);
  return fragmentsUsed.map(fragmentName => getFragmentText(fragmentName)).join("\n");
}

