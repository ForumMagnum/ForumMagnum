import gql from 'graphql-tag';
import * as _ from 'underscore';

interface FragmentDefinition {
  fragmentText: string
  subFragments?: Array<FragmentName>
  fragmentObject?: any
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
  const subFragments = _.unique(matchedSubFragments.map(f => f.replace('...', '')));
  
  // register fragment
  Fragments[fragmentName] = {
    fragmentText
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
  const gqlArguments = subFragments ? [literals, ...subFragments.map(subFragmentName => {
    // return subfragment's gql fragment
    if (!Fragments[subFragmentName]) {
      throw new Error(`Subfragment “${subFragmentName}” of fragment “${extractFragmentName(fragmentText)}” has not been defined.`);
    }
    
    return getFragment(subFragmentName);
  })] : [literals];

  return gql.apply(null, gqlArguments);
};

// Create default "dumb" gql fragment object for a given collection
export const getDefaultFragmentText = <T extends DbObject>(collection: CollectionBase<T>, schema: SchemaType<T>, options={onlyViewable: true}): string|null => {
  const fieldNames = _.reject(_.keys(schema), (fieldName: string) => {
    /*

    Exclude a field from the default fragment if
    1. it has a resolver and addOriginalField is false
    2. it has $ in its name
    3. it's not viewable (if onlyViewable option is true)

    */
    const field: CollectionFieldSpecification<T> = schema[fieldName];
    // OpenCRUD backwards compatibility
    return (field.resolveAs && !field.resolveAs.addOriginalField) || fieldName.includes('$') || fieldName.includes('.') || (options.onlyViewable && !(field.canRead || field.viewableBy));
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
export const getFragmentName = fragment => fragment && fragment.definitions[0] && fragment.definitions[0].name.value;

// Get actual gql fragment
export const getFragment = (fragmentName: FragmentName) => {
  if (!Fragments[fragmentName]) {
    throw new Error(`Fragment "${fragmentName}" not registered.`);
  }
  if (!Fragments[fragmentName].fragmentObject) {
    initializeFragment(fragmentName);
  }
  // return fragment object created by gql
  return Fragments[fragmentName].fragmentObject;  
};

// Get gql fragment text
export const getFragmentText = (fragmentName: FragmentName): string => {
  if (!Fragments[fragmentName]) {
    throw new Error(`Fragment "${fragmentName}" not registered.`);
  }
  // return fragment object created by gql
  return Fragments[fragmentName].fragmentText;  
};

export const initializeFragment = (fragmentName: FragmentName): void => {
  const fragment = Fragments[fragmentName];
  Fragments[fragmentName].fragmentObject = getFragmentObject(fragment.fragmentText, fragment.subFragments);
};

export const getAllFragmentNames = (): Array<FragmentName> => {
  return Object.keys(Fragments) as Array<FragmentName>;
}


const addFragmentDependencies = (fragments: Array<FragmentName>): Array<FragmentName> => {
  const result = [...fragments];
  for (let i=0; i<result.length; i++) {
    const dependencies = Fragments[result[i]].subFragments;
    if (dependencies) {
      _.forEach(dependencies, (subfragment: FragmentName) => {
        if (!_.find(result, (s: FragmentName)=>s==subfragment))
          result.push(subfragment);
      });
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
