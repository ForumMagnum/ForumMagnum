import type { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

// This is safe as it uses `import type`
// eslint-disable-next-line import/no-restricted-paths
import type SqlFragment from '@/server/sql/SqlFragment';
import reject from 'lodash/reject';
import uniq from 'lodash/uniq';

interface FragmentDefinition {
  fragmentText: string
  subFragments?: Array<FragmentName>
  fragmentObject?: DocumentNode
  sqlFragment?: SqlFragment,
}

const Fragments: Record<FragmentName,FragmentDefinition> = {} as any;

// Get a fragment's name from its text
export const extractFragmentName = (fragmentText: string): FragmentName => {
  const match = fragmentText.match(/fragment (.*) on/)
  if (!match) throw new Error("Could not extract fragment name");
  return match[1] as FragmentName;
}


// Register a fragment, including its text, the text of its subfragments, and the fragment object
export const registerFragment = (fragmentTextSource: string): void => {
  // remove comments
  const fragmentText = fragmentTextSource.replace(/#.*\n/g, '\n');

  // extract name from fragment text
  const fragmentName = extractFragmentName(fragmentText) as FragmentName;

  // extract subFragments from text
  const matchedSubFragments = fragmentText.match(/\.{3}([_A-Za-z][_0-9A-Za-z]*)/g) || [];
  const subFragments = uniq(matchedSubFragments.map(f => f.replace('...', '')));

  const sqlFragment = bundleIsServer
    // eslint-disable-next-line import/no-restricted-paths, babel/new-cap
    ? new (require("@/server/sql/SqlFragment").default)(
      fragmentText,
      (name: FragmentName) => Fragments[name].sqlFragment ?? null,
    )
    : undefined;

  // register fragment
  Fragments[fragmentName] = {
    fragmentText,
    sqlFragment,
  };

  // also add subfragments if there are any
  if(subFragments && subFragments.length) {
    Fragments[fragmentName].subFragments = subFragments as Array<FragmentName>;
  }
};

// Create gql fragment object from text and subfragments
const getFragmentObject = (fragmentText: string, subFragments: Array<FragmentName>|undefined) => {
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
};

// Create default "dumb" gql fragment object for a given collection
export const getDefaultFragmentText = <N extends CollectionNameString>(
  collection: CollectionBase<N>,
  schema: SchemaType<N>,
  options={onlyViewable: true},
): string|null => {
  const fieldNames = reject(Object.keys(schema), (fieldName: string) => {
    /*

    Exclude a field from the default fragment if
    1. it has a resolver and addOriginalField is false
    2. it has $ in its name
    3. it's not viewable (if onlyViewable option is true)

    */
    const field: CollectionFieldSpecification<N> = schema[fieldName];
    // OpenCRUD backwards compatibility

    const isResolverField = field.resolveAs && !field.resolveAs.addOriginalField && field.resolveAs.type !== "ContentType";
    return isResolverField || fieldName.includes('$') || fieldName.includes('.') || (options.onlyViewable && !field.canRead);
  });

  if (fieldNames.length) {
    const fragmentText = `
      fragment ${collection.options.collectionName}DefaultFragment on ${collection.typeName} {
        ${fieldNames.map(fieldName => {
          return fieldName+'\n';
        }).join('')}
      }
    `;

    return fragmentText;
  } else {
    return null;
  }
};

// Get fragment name from fragment object
export const getFragmentName = (fragment: AnyBecauseTodo) => fragment && fragment.definitions[0] && fragment.definitions[0].name.value;

export const isValidFragmentName = (name: string): name is FragmentName =>
  !!Fragments[name as FragmentName];

// Get actual gql fragment
export const getFragment = (fragmentName: FragmentName): DocumentNode => {
  if (!isValidFragmentName(fragmentName)) {
    throw new Error(`Fragment "${fragmentName}" not registered.`);
  }
  const fragmentObject = Fragments[fragmentName].fragmentObject;
  if (!fragmentObject) {
    // return fragment object created by gql
    return initializeFragment(fragmentName);
  }
  return fragmentObject;
};

export const getSqlFragment = (fragmentName: FragmentName): SqlFragment => {
  // TODO: Should we also check that nested fragment names are also defined?
  if (!isValidFragmentName(fragmentName)) {
    throw new Error(`Fragment "${fragmentName}" not registered.`);
  }
  const {sqlFragment} = Fragments[fragmentName];
  if (!sqlFragment) {
    throw new Error(`SQL fragment missing (did you request it on the client?)`);
  }
  return sqlFragment;
}

// Get gql fragment text
export const getFragmentText = (fragmentName: FragmentName): string => {
  if (!Fragments[fragmentName]) {
    throw new Error(`Fragment "${fragmentName}" not registered.`);
  }
  // return fragment object created by gql
  return Fragments[fragmentName].fragmentText;  
};

export const initializeFragment = (fragmentName: FragmentName): DocumentNode => {
  const fragment = Fragments[fragmentName];
  const fragmentObject = getFragmentObject(fragment.fragmentText, fragment.subFragments);
  Fragments[fragmentName].fragmentObject = fragmentObject;
  return fragmentObject;
};

export const getAllFragmentNames = (): Array<FragmentName> => {
  return Object.keys(Fragments) as Array<FragmentName>;
}


const addFragmentDependencies = (fragments: Array<FragmentName>): Array<FragmentName> => {
  const result = [...fragments];
  for (let i=0; i<result.length; i++) {
    const dependencies = Fragments[result[i]].subFragments;
    if (dependencies) {
      for (const subfragment of dependencies) {
        if (!result.find((s: FragmentName)=>s===subfragment)) {
          result.push(subfragment);
        }
      }
    }
  }
  return result;
}

// Given a fragment name (or an array of fragment names), return text which can
// be added to a graphql query to define that fragment (or fragments) and its
// (or their) dependencies.
export const fragmentTextForQuery = (fragmentOrFragments: FragmentName|Array<FragmentName>): string => {
  const rootFragments: Array<FragmentName> = Array.isArray(fragmentOrFragments) ? fragmentOrFragments : [fragmentOrFragments];
  const fragmentsUsed = addFragmentDependencies(rootFragments);
  return fragmentsUsed.map(fragmentName => getFragmentText(fragmentName)).join("\n");
}
