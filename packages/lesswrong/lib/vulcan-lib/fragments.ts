import type { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
import * as _ from 'underscore';
// This has a stub for the client bundle
import SqlFragment from '@/server/sql/SqlFragment';
import { allFragments } from '../fragments/allFragments';

interface FragmentDefinition {
  fragmentText: string
  subFragments?: Array<FragmentName>
  fragmentObject?: DocumentNode
  sqlFragment?: SqlFragment,
}

const Fragments: Partial<Record<FragmentName,FragmentDefinition>> = {};

function getMemoizedFragmentInfo(fragmentName: FragmentName): FragmentDefinition {
  let fragmentDefinition = Fragments[fragmentName];
  if (!fragmentDefinition) {
    fragmentDefinition = registerFragment(allFragments[fragmentName]);
    Fragments[fragmentName] = fragmentDefinition;
  }

  return fragmentDefinition;
}

// Get a fragment's name from its text
function extractFragmentName(fragmentText: string): FragmentName {
  const match = fragmentText.match(/fragment (.*) on/)
  if (!match) throw new Error("Could not extract fragment name");
  return match[1] as FragmentName;
}


// Register a fragment, including its text, the text of its subfragments, and the fragment object
function registerFragment(fragmentTextSource: string): FragmentDefinition {
  // remove comments
  const fragmentText = fragmentTextSource.replace(/#.*\n/g, '\n');

  // extract subFragments from text
  const matchedSubFragments = fragmentText.match(/\.{3}([_A-Za-z][_0-9A-Za-z]*)/g) || [];
  const subFragments = _.unique(matchedSubFragments.map(f => f.replace('...', '')));

  const sqlFragment = bundleIsServer
    // eslint-disable-next-line import/no-restricted-paths, babel/new-cap
    ? new SqlFragment(
      fragmentText,
      (name: FragmentName) => getMemoizedFragmentInfo(name).sqlFragment ?? null,
    )
    : undefined;

  const fragmentDefinition: FragmentDefinition = {
    fragmentText,
    sqlFragment,
  };

  if (subFragments && subFragments.length) {
    fragmentDefinition.subFragments = subFragments as Array<FragmentName>;
  }

  return fragmentDefinition;
};

// Create gql fragment object from text and subfragments
function getFragmentObject(fragmentText: string, subFragments: Array<FragmentName>|undefined): DocumentNode {
  // pad the literals array with line returns for each subFragments
  const literals = subFragments ? [fragmentText, ...subFragments.map(x => '\n')] : [fragmentText];

  // the gql function expects an array of literals as first argument, and then sub-fragments as other arguments
  const gqlArguments: [string | readonly string[], ...any[]] = subFragments ? [literals, ...subFragments.map(subFragmentName => {
    // return subfragment's gql fragment
    if (!Fragments[subFragmentName]) {
      throw new Error(`Subfragment “${subFragmentName}” of fragment “${extractFragmentName(fragmentText)}” has not been defined.`);
    }
    
    return getFragment(subFragmentName);
  }).filter((fragment): fragment is DocumentNode => fragment !== undefined)] : [literals];

  return gql.apply(null, gqlArguments);
}

// Get fragment name from fragment object
export function getFragmentName(fragment: AnyBecauseTodo) {
  return fragment && fragment.definitions[0] && fragment.definitions[0].name.value;
}

export function isValidFragmentName(name: string): name is FragmentName {
  return !!allFragments[name as FragmentName];
}

// Get actual gql fragment
export function getFragment(fragmentName: FragmentName): DocumentNode {
  if (!isValidFragmentName(fragmentName)) {
    throw new Error(`Fragment "${fragmentName}" not registered.`);
  }
  const fragmentObject = getMemoizedFragmentInfo(fragmentName).fragmentObject;
  if (!fragmentObject) {
    // return fragment object created by gql
    return initializeFragment(fragmentName);
  }
  return fragmentObject;
};

export function getSqlFragment(fragmentName: FragmentName): SqlFragment {
  // TODO: Should we also check that nested fragment names are also defined?
  if (!isValidFragmentName(fragmentName)) {
    throw new Error(`Fragment "${fragmentName}" not registered.`);
  }
  const {sqlFragment} = getMemoizedFragmentInfo(fragmentName);
  if (!sqlFragment) {
    throw new Error(`SQL fragment missing (did you request it on the client?)`);
  }
  return sqlFragment;
}

/**
 * WARNING: This doesn't include the subfragments, so it's not a full fragment definition.
 * Don't use this for anything that requires the subfragments
 */
function getFragmentText(fragmentName: FragmentName): string {
  if (!Fragments[fragmentName]) {
    throw new Error(`Fragment "${fragmentName}" not registered.`);
  }
  // return fragment object created by gql
  return getMemoizedFragmentInfo(fragmentName).fragmentText;  
}

export function initializeFragment(fragmentName: FragmentName): DocumentNode {
  const fragment = getMemoizedFragmentInfo(fragmentName);
  const fragmentObject = getFragmentObject(fragment.fragmentText, fragment.subFragments);
  fragment.fragmentObject = fragmentObject;
  return fragmentObject;
}

export function getAllFragmentNames(): Array<FragmentName> {
  return Object.keys(Fragments) as Array<FragmentName>;
}


function addFragmentDependencies(fragments: Array<FragmentName>): Array<FragmentName> {
  const result = [...fragments];
  for (let i=0; i<result.length; i++) {
    const dependencies = getMemoizedFragmentInfo(result[i]).subFragments;
    if (dependencies) {
      _.forEach(dependencies, (subfragment: FragmentName) => {
        if (!_.find(result, (s: FragmentName)=>s===subfragment))
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
