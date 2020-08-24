import gql from 'graphql-tag';
import * as _ from 'underscore';

interface ParsedFragment {
  fragmentText: string
  fragmentObject?: any
  subFragments?: Array<string>
}
const Fragments: Partial<Record<string,ParsedFragment>> = {};

// Get a fragment's name from its text
export const extractFragmentName = (fragmentText: string): string => {
  const match = fragmentText.match(/fragment (.*) on/);
  if (!match) throw new Error("Invalid fragment specification");
  return match[1];
}


// Register a fragment, including its text, the text of its subfragments, and the fragment object
export const registerFragment = (fragmentTextSource: string) => {
  // remove comments
  const fragmentText = fragmentTextSource.replace(/#.*\n/g, '\n');

  // extract name from fragment text
  const fragmentName = extractFragmentName(fragmentText);

  // extract subFragments from text
  const matchedSubFragments = fragmentText.match(/\.{3}([_A-Za-z][_0-9A-Za-z]*)/g) || [];
  const subFragments = _.unique(matchedSubFragments.map(f => f.replace('...', '')));
  
  // register fragment
  Fragments[fragmentName] = {
    fragmentText
  };

  // also add subfragments if there are any
  if(subFragments && subFragments.length) {
    Fragments[fragmentName]!.subFragments = subFragments;
  }

};

// Create gql fragment object from text and subfragments
const getFragmentObject = (fragmentText: string, subFragments: Array<string>|undefined) => {
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
export const getDefaultFragmentText = (collection, options = { onlyViewable: true }) => {
  const schema = collection.simpleSchema()._schema;
  const fieldNames = _.reject(_.keys(schema), fieldName => {
    /*

    Exclude a field from the default fragment if
    1. it has a resolver and addOriginalField is false
    2. it has $ in its name
    3. it's not viewable (if onlyViewable option is true)

    */
    const field = schema[fieldName];
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
export const getFragment = (fragmentName: string) => {
  if (!Fragments[fragmentName]) {
    throw new Error(`Fragment "${fragmentName}" not registered.`);
  }
  if (!Fragments[fragmentName]!.fragmentObject) {
    initializeFragment(fragmentName);
  }
  // return fragment object created by gql
  return Fragments[fragmentName]!.fragmentObject;
};

// Get gql fragment text
export const getFragmentText = (fragmentName: string) => {
  if (!Fragments[fragmentName]) {
    throw new Error(`Fragment "${fragmentName}" not registered.`);
  }
  // return fragment object created by gql
  return Fragments[fragmentName]!.fragmentText;
};

export const initializeFragment = (fragmentName: string) => {
  const fragment = Fragments[fragmentName];
  if (!fragment) throw new Error(`No such fragment: ${fragmentName}`);
  fragment.fragmentObject = getFragmentObject(fragment.fragmentText, fragment.subFragments);
};

export const getAllFragmentNames = () => {
  return Object.keys(Fragments);
}
