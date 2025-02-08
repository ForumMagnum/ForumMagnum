import type { DocumentNode, FragmentDefinitionNode, FieldNode, GraphQLScalarType } from 'graphql';
import gql from 'graphql-tag';
import * as _ from 'underscore';
// This has a stub for the client bundle
import SqlFragment from '@/server/sql/SqlFragment';
import { getCollectionByTypeName } from './getCollection';

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
  const subFragments = _.unique(matchedSubFragments.map(f => f.replace('...', '')));

  const sqlFragment = bundleIsServer
    // eslint-disable-next-line import/no-restricted-paths, babel/new-cap
    ? new SqlFragment(
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

  // Validate that the fragment isn't missing any _id fields nested in collection-type fields
  const fragmentDef = parseGraphQLFragment(fragmentText);
  validateFragmentSelections(fragmentDef, fragmentDef.typeCondition.name.value);
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
  const fieldNames = _.reject(_.keys(schema), (fieldName: string) => {
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

/**
 * WARNING: This doesn't include the subfragments, so it's not a full fragment definition.
 * Don't use this for anything that requires the subfragments
 */
const getFragmentText = (fragmentName: FragmentName): string => {
  if (!Fragments[fragmentName]) {
    throw new Error(`Fragment "${fragmentName}" not registered.`);
  }
  // return fragment object created by gql
  return Fragments[fragmentName].fragmentText;  
};

const parseGraphQLFragment = (fragmentText: string) => {
  const parsed = gql`${fragmentText}`;
  if (!parsed.definitions[0] || parsed.definitions[0].kind !== 'FragmentDefinition') {
    throw new Error("Invalid fragment definition");
  }
  return parsed.definitions[0];
}

// get GraphQL type for a given schema and field name
export const getGraphQLType = <N extends CollectionNameString>(
  schema: SchemaType<N>,
  fieldName: string,
  isInput = false,
): string|null => {
  const field = schema[fieldName];
  const type = field.type.singleType;
  const typeName =
    typeof type === 'object' ? 'Object' : typeof type === 'function' ? type.name : type;

  // LESSWRONG: Add optional property to override default input type generation
  if (isInput && field.inputType) {
    return field.inputType
  }

  switch (typeName) {
    case 'String':
      return 'String';

    case 'Boolean':
      return 'Boolean';

    case 'Number':
      return 'Float';

    case 'SimpleSchema.Integer':
      return 'Int';

    // for arrays, look for type of associated schema field or default to [String]
    case 'Array':
      const arrayItemFieldName = `${fieldName}.$`;
      // note: make sure field has an associated array
      if (schema[arrayItemFieldName]) {
        // try to get array type from associated array
        const arrayItemType = getGraphQLType(schema, arrayItemFieldName);
        return arrayItemType ? `[${arrayItemType}]` : null;
      }
      return null;

    case 'Object':
      return 'JSON';

    case 'Date':
      return 'Date';

    default:
      return null;
  }
};

interface SelectionFieldInfo {
  fieldName: string;
  fieldType: string | GraphQLScalarType | null;
  selection: FieldNode;
}

interface MaybeCollectionFieldInfo extends SelectionFieldInfo {
  fieldType: string;
}

const isMaybeCollectionFieldInfo = (fieldInfo: SelectionFieldInfo): fieldInfo is MaybeCollectionFieldInfo => {
  return typeof fieldInfo.fieldType === 'string';
};

const resolveFragmentFieldNode = (fragmentDef: FragmentDefinitionNode | FieldNode, resolveSchemaFieldMap: Record<string, string>, schema: SchemaType<CollectionNameString>) => {
  const fieldName = resolveSchemaFieldMap[fragmentDef.name.value] ?? fragmentDef.name.value;
  const field = schema[fieldName];
  return { fieldName, field };
};

const isValidCollectionName = (fieldType: string) => {
  // Array and/or non-nullable collection types still need to be checked, so strip out the brackets and exclamation marks
  const maybeCollectionName = fieldType.replace(/[![\]]+/g, "");
  try {
    getCollectionByTypeName(maybeCollectionName);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * We need to validate that the fragment isn't missing any _id fields nested in collection-type fields
 * If that happens, it can cause weird client-side bugs where the apollo cache doesn't know how to resolve stuff
 * Sometimes stuff blows up, sometimes weirder and more annoying things happen.
 * Anyways, there's not really a reason to want to omit the field.
 * 
 * This isn't perfect because it doesn't check non-collection-based fragments, since we don't have
 * a good way of checking the "intended" type of any given field inside one of those fragments.
 */
const validateFragmentSelections = (fragmentDef: FragmentDefinitionNode | FieldNode, typeName: string) => {
  const selectionSet = fragmentDef.selectionSet;
  
  // Get the collection for this type if it exists
  let collection: CollectionBase<CollectionNameString>|null = null;
  try {
    collection = getCollectionByTypeName(typeName.replace(/[![\]]+/g, ""));
  } catch (e) {
    // Not a collection type, skip validation
    return;
  }

  if (!selectionSet) return;

  const schema = collection._schemaFields;

  // For fragments on collections, we only need to check fields that have a resolver
  // Other fields won't have _id fields nested in them (with the exception of normalized editable fields, which get treated as resolver fields anyways)
  const resolverFields = Object.keys(schema).filter(fieldName => schema[fieldName].resolveAs);

  // However, since we'll be mapping over the selection set, which will contain field names that don't actually exist in the schema,
  // we need to map the "resolver field" names referenced in the fragment to the actual schema field names that generated them
  const resolverFieldToOriginalFieldMap = Object.fromEntries(
    resolverFields.map(fieldName => [schema[fieldName].resolveAs?.fieldName ?? fieldName, fieldName])
  );

  const selectionResolverFieldMetadata = selectionSet.selections
    .filter((selection): selection is FieldNode => selection.kind === 'Field')
    .map(selection => {
      const { field, fieldName } = resolveFragmentFieldNode(selection, resolverFieldToOriginalFieldMap, schema);
      return { field, fieldName, selection };
    })
    // Filter out fields that don't have a resolver
    .filter(({ field }) => !!field?.resolveAs)
    .map(({ fieldName, field, selection }) => {
      const fieldType = field.resolveAs?.type ?? getGraphQLType(schema, fieldName);
      return { fieldName, fieldType, selection };
    })
    // Filter out fields that aren't even possibly collection types
    .filter(isMaybeCollectionFieldInfo);

  for (const { selection, fieldName, fieldType } of selectionResolverFieldMetadata) {
    const validCollectionName = isValidCollectionName(fieldType);
    
    if (validCollectionName && selection.selectionSet) {
      const { selections } = selection.selectionSet;

      // Check if there's a fragment spread - if so, we don't need to check for _id
      // since we'll check the nested fragment at some point, and if that doesn't have _id,
      // we'll fail validation anyway.
      const hasSpread = selections.some(s => s.kind === 'FragmentSpread');
      const hasId = selections.some(s => s.kind === 'Field' && s.name.value === '_id');

      // If there's no fragment spread and no _id field on a field that's resolved to a collection type, throw an error
      if (!hasSpread && !hasId) {
        throw new Error(`Fragment "${fragmentDef.name.value}" is missing _id field for collection type "${fieldType}" in field "${fieldName}"`);
      }
      
      // Recursively validate nested selections
      validateFragmentSelections(selection, fieldType);
    }
  }
}

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
export const fragmentTextForQuery = (fragmentOrFragments: FragmentName|Array<FragmentName>): string => {
  const rootFragments: Array<FragmentName> = Array.isArray(fragmentOrFragments) ? fragmentOrFragments : [fragmentOrFragments];
  const fragmentsUsed = addFragmentDependencies(rootFragments);
  return fragmentsUsed.map(fragmentName => getFragmentText(fragmentName)).join("\n");
}
