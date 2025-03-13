import * as fs from 'fs';
import * as path from 'path';
import { allSchemas, getSchema, getSimpleSchema } from '../../lib/schema/allSchemas';
import { augmentSchemas } from '../resolvers/allFieldAugmentations';

// Run the augmentSchemas function to make sure all schemas are properly augmented
augmentSchemas();

// Base directory where collection schemas are stored
const collectionBasePath = path.join(__dirname, '../../lib/collections');

type PropsWithOptionalDefaults = ReadonlyArray<string | readonly [string, AnyBecauseHard]>;

type FieldWithResolveAs = CollectionFieldSpecification<CollectionNameString> & { resolveAs: CollectionFieldResolveAs<CollectionNameString> };

// Extract database field properties
const databaseProps = [
  'type',
  'defaultValue',
  'typescriptType',
  'denormalized',
  'canAutoDenormalize',
  'canAutofillDefault',
  'needsUpdate',
  'getValue',
  'foreignKey',
  'logChanges',
  'nullable',
] as const;

// Extract GraphQL field properties
const graphqlProps = [
  'canRead',
  ['canUpdate', []],
  ['canCreate', []],
  'onCreate',
  'onUpdate',
  'onDelete',
  'countOfReferences',
  'editableFieldOptions',
  'slugCallbackOptions',
] as const;

// Extract form field properties
const formProps = [
  'description',
  'min',
  'max',
  'minCount',
  'maxCount',
  'options',
  'form',
  'beforeComponent',
  'afterComponent',
  'order',
  'label',
  'tooltip',
  'control',
  'placeholder',
  'hidden',
  'group',
] as const;

function getGraphQLType<N extends CollectionNameString>(
  schema: SchemaType<N>,
  fieldName: string,
  isInput = false,
): string|null {
  const field = schema[fieldName];
  const type = field.type.singleType;
  const typeName =
    typeof type === 'object' ? 'Object' : typeof type === 'function' ? type.name : type;

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

function stringifyFunctionWithProperImports(func: Function): string {
  const funcStr = func.toString();
  return funcStr.replace(/\(0, _([\w]+)\.([\w]+)\)/g, (match, importName, funcName) => {
    if (funcName === 'default') {
      return importName;
    }

    return funcName;
  });
}

function fieldHasResolveAs(field: CollectionFieldSpecification<CollectionNameString>): field is FieldWithResolveAs {
  return !!field.resolveAs;
}

interface FieldValueSubstitutionProps<F extends CollectionFieldSpecification<CollectionNameString> = CollectionFieldSpecification<CollectionNameString>> {
  func: Function;
  field: F;
  fieldName: string;
  collectionName: CollectionNameString;
}

function spaces(n: number) {
  return ' '.repeat(n);
}

const defaultFieldValueSubstitutions = {
  onCreate: (context: FieldValueSubstitutionProps) => {
    const { func, field } = context;
    switch (func.name) {
      case 'fillIfMissing':
        const defaultValue = field.defaultValue;
        // TODO: some of these are evaluated constants; seems bad to lose the references.  What to do?
        const inlineRepresentation = typeof defaultValue === 'string'
          ? `"${defaultValue}"`
          : defaultValue;

        return `${func.name}(${inlineRepresentation})`;

      case 'denormalizedFieldOnCreate':
        // TODO: we should probably hoist these to named functions at the top level of the generated code
        // and then refer to them by name here.
        const { getValue, needsUpdate } = field;

        const getValuePart = getValue
          ? `getValue: ${formatValue(getValue, context, 'getValue')},`
          : '';

        const needsUpdatePart = needsUpdate
          ? `needsUpdate: ${formatValue(needsUpdate, context, 'needsUpdate')}`
          : '';

        return `${func.name}({ ${getValuePart}${needsUpdatePart} })`;
      default:
        return func;
    }
  },
  onUpdate: (context: FieldValueSubstitutionProps) => {
    const { func, field } = context;
    switch (func.name) {
      case 'throwIfSetToNull':
        return func.name;
      case 'denormalizedFieldOnUpdate':
        // TODO: we should probably hoist these to named functions at the top level of the generated code
        // and then refer to them by name here.
        const { getValue, needsUpdate } = field;

        const getValuePart = getValue
          ? `getValue: ${formatValue(getValue, context, 'getValue')},`
          : '';

        const needsUpdatePart = needsUpdate
          ? `needsUpdate: ${formatValue(needsUpdate, context, 'needsUpdate')}`
          : '';

        return `${func.name}({ ${getValuePart}${needsUpdatePart} })`;
      default:
        return func;
    }
  },
  resolver: (context: FieldValueSubstitutionProps) => {
    const { func, fieldName, collectionName, field } = context;
    switch (func.name) {
      case 'normalizedEditableResolver':
      case 'revisionsResolver':
      case 'versionResolver':
        return `${func.name}('${fieldName}')`;
      case 'denormalizedEditableResolver':
        return `${func.name}('${collectionName}', '${fieldName}')`;
      case 'idResolverSingle':
        return `generateIdResolverSingle('${collectionName}', '${fieldName}', ${field.nullable})`;
      case 'idResolverMulti':
        return `generateIdResolverMulti('${collectionName}', '${fieldName}', /* getKey - only needed for bookmarkedPostsMetadata and hiddenPostsMetadata */)`;
      default:
        return func;
    }
  },
  sqlResolver: ({ func, fieldName, collectionName, field }: FieldValueSubstitutionProps) => {
    switch (func.name) {
      case 'normalizedEditableSqlResolver':
        return `${func.name}('${fieldName}')`;
      case 'foreignKeySqlResolver':
        return `getForeignKeySqlResolver({ collectionName: '${collectionName}', nullable: ${field.nullable}, idFieldName: '${fieldName}' })`;
      default:
        return func;
    }
  },
  sqlPostProcess: ({ func, fieldName }: FieldValueSubstitutionProps) => func,
  getValue: (context: FieldValueSubstitutionProps) => {
    const { func, fieldName, collectionName, field } = context;
    switch (func.name) {
      case 'denormalizedCountOfReferencesGetValue':
        if (!field.countOfReferences) {
          throw new Error(`Count of references not found for field ${fieldName} in collection ${collectionName}`);
        }
        const { foreignCollectionName, foreignFieldName, filterFn, resyncElastic } = field.countOfReferences;
        const collectionNamePart = `\n${spaces(8)}collectionName: '${collectionName}',`;
        const fieldNamePart = `\n${spaces(8)}fieldName: '${fieldName}',`;
        const foreignCollectionNamePart = `\n${spaces(8)}foreignCollectionName: '${foreignCollectionName}',`;
        const foreignFieldNamePart = `\n${spaces(8)}foreignFieldName: '${foreignFieldName}',`;
        const filterFnPart = filterFn ? `\n${spaces(8)}filterFn: ${stringifyFunctionWithProperImports(filterFn)},` : '';
        const resyncElasticPart = resyncElastic ? `\n${spaces(8)}resyncElastic: ${resyncElastic},` : '';
        return `denormalizedCountOfReferencesGetValue({${collectionNamePart}${fieldNamePart}${foreignCollectionNamePart}${foreignFieldNamePart}${filterFnPart}${resyncElasticPart}\n${spaces(6)}})`;
      default:
        return func;
    }
  }
}

function formatFunctionValue(value: Function, context: FieldValueSubstitutionProps, propertyName?: string): string {
  if (propertyName && propertyName in defaultFieldValueSubstitutions) {
    const substitution = defaultFieldValueSubstitutions[propertyName as keyof typeof defaultFieldValueSubstitutions];
    const substitutedValue = substitution({ ...context, func: value });
    if (substitutedValue !== value && typeof substitutedValue === 'string') {
      return substitutedValue;
    }
  }

  // Special case for function fields that should preserve their implementation
  const functionImplementationFields = ['onCreate', 'onUpdate', 'onDelete', 'getValue', 'resolver', 'sqlResolver', 'sqlPostProcess', 'needsUpdate', 'hidden', 'options', 'filterFn'];
  const shouldPreserveFunctionImpl = propertyName && functionImplementationFields.includes(propertyName);
  
  if (value === String) return '"String"';
  if (value === Number) return '"Number"';
  if (value === Boolean) return '"Boolean"';
  if (value === Date) return '"Date"';
  if (value === Object) return '"Object"';
  if (value === Array) return '"Array"';
  
  // For function implementation fields, preserve the full implementation
  if (shouldPreserveFunctionImpl) {
    return stringifyFunctionWithProperImports(value);
  }
  
  // For named functions, preserve the function name
  if (value.name && value.name !== 'anonymous') {
    return value.name;
  }
  
  // For other functions, use toString but clean up the output
  const funcStr = value.toString();
  // If it's a simple function, extract a meaningful identifier
  if (funcStr.includes('=>')) {
    const simplified = funcStr.replace(/\s+/g, ' ').substring(0, 50);
    return `"function:${simplified}${simplified.length >= 50 ? '...' : ''}"`;
  }
  
  return `"function:${funcStr.substring(0, 50)}${funcStr.length >= 50 ? '...' : ''}"`;
}

// Helper function to properly format a value
function formatValue(value: any, context: Omit<FieldValueSubstitutionProps, 'func'>, propertyName?: string): string {
  if (value === undefined || value === null) {
    return '';
  }

  // Handle arrays specially to properly handle functions within arrays
  if (Array.isArray(value)) {
    // For array items, we don't have property names, so always use simplified function format
    const formattedElements = value.map(element => formatValue(element, context));
    return `[${formattedElements.join(', ')}]`;
  }
  
  // Handle functions specially
  if (typeof value === 'function') {
    return formatFunctionValue(value, { ...context, func: value }, propertyName);
  }
  
  // Handle SimpleSchema objects more cleanly
  if (value && typeof value === 'object' && value._constructorOptions) {
    return '"SimpleSchema"';
  }
  
  // For regular objects, try to handle them better by inspecting properties
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    try {
      // Try to create a more meaningful representation
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      
      // For objects with reasonable number of properties
      // if (keys.length <= 5) {
        const props = keys.map(key => {
          const propValue = formatValue(value[key], context, key);
          if (propValue.length > 0) {
            return `"${key}": ${propValue}`;
          }
          return undefined;
        }).filter(prop => prop !== undefined);
        return `{${props.join(', ')}}`;
      // }
      
      // // For larger objects, just return a placeholder
      // return `"{Object with ${keys.length} properties}"`;
    } catch (e) {
      // Fallback to default JSON if we encounter any issues
      return JSON.stringify(value);
    }
  }
  
  return JSON.stringify(value);
};

// Helper function to build a section with properties
function buildSection(
  props: PropsWithOptionalDefaults,
  section: string,
  field: CollectionFieldSpecification<CollectionNameString>,
  context: Omit<FieldValueSubstitutionProps, 'func'>,
): string[] {
  const lines: string[] = [];
  
  for (const prop of props) {
    const propName = typeof prop === 'string' ? prop : prop[0];
    const defaultValue = typeof prop === 'string' ? undefined : prop[1];
    if (propName === 'type' && section === 'database') continue; // Handle type separately for database
    
    // Use type assertion since we know these properties are part of the schema
    const value = (field as any)[propName] ?? defaultValue;
    if (value !== undefined) {
      // Pass the property name to formatValue so it can make context-specific decisions
      lines.push(`      ${propName}: ${formatValue(value, context, propName)},`);
    }
  }
  
  return lines;
};

function convertResolveAsFunction({
    field,
    fieldName,
    collectionName,
  }: Omit<FieldValueSubstitutionProps<FieldWithResolveAs>, 'func'>,
  propertyName: keyof typeof defaultFieldValueSubstitutions & keyof typeof field['resolveAs'],
) {
  const func = field.resolveAs[propertyName];
  if (!func) {
    throw new Error(`Function ${propertyName} not found in ${fieldName}.resolveAs`);
  }
  
  const substitution = defaultFieldValueSubstitutions[propertyName]({
    func,
    fieldName,
    collectionName,
    field,
  });

  if (substitution !== func) {
    return substitution;
  }

  return stringifyFunctionWithProperImports(func);
}


function extractAdditionalResolverField(context: Omit<FieldValueSubstitutionProps<FieldWithResolveAs>, 'func'>) {
  const { field, fieldName } = context;
  const resolveAsFieldName = field.resolveAs.fieldName || `${fieldName}Resolved`;

  const graphqlResolveAsContent = [];

  if (field.resolveAs.type) {
    graphqlResolveAsContent.push(`    type: ${formatValue(field.resolveAs.type, context)},`);
  }

  if (field.canRead) {
    graphqlResolveAsContent.push(`    canRead: ${formatValue(field.canRead, context)},`);
  }

  if (field.resolveAs.arguments !== undefined) {
    graphqlResolveAsContent.push(`    arguments: ${formatValue(field.resolveAs.arguments, context)},`);
  }

  graphqlResolveAsContent.push(`    resolver: ${convertResolveAsFunction(context, 'resolver')},`);

  if (field.resolveAs.sqlResolver) {
    graphqlResolveAsContent.push(`    sqlResolver: ${convertResolveAsFunction(context, 'sqlResolver')},`);
  }

  if (field.resolveAs.sqlPostProcess) {
    graphqlResolveAsContent.push(`    sqlPostProcess: ${convertResolveAsFunction(context, 'sqlPostProcess')},`);
  }

  const resolveAsField = `  ${resolveAsFieldName}: {
    graphql: {
${graphqlResolveAsContent.join('\n')}
    },
    form: {
      hidden: true,
    },
  },`;
  return resolveAsField;
}

function convertDatabaseField(
  typeString: string,
  field: CollectionFieldSpecification<CollectionNameString>,
  isArrayField: boolean,
  fieldName: string,
  schema: SchemaType<CollectionNameString>,
  collectionName: CollectionNameString,
) {
  const context = { field, fieldName, collectionName };
  const databaseSection = buildSection(databaseProps, 'database', field, context);
  const graphqlSection = buildSection(graphqlProps, 'graphql', field, context);
  const formSection = buildSection(formProps, 'form', field, context);

  const databaseContent = typeString ? [typeString, ...databaseSection] : databaseSection;
  // const typeValueForGraphQL = getFieldTypeString(field, isArrayField, fieldName, schema, context);
  const simpleSchema = getSimpleSchema(collectionName)._schema;
  const typeValueForGraphQL = getGraphQLTypeString(simpleSchema, fieldName);

  const baseField = `  ${fieldName}: {${databaseContent.length > 0 ? `
    database: {
${databaseContent.join('\n')}
    },` : ''}${graphqlSection.length > 0 || typeValueForGraphQL ? `
    graphql: {
${typeValueForGraphQL}
${graphqlSection.join('\n')}
    },` : ''}${formSection.length > 0 ? `
    form: {
${formSection.join('\n')}
    },` : ''}
  },`;
  return baseField;
}

function checkIfArrayField(field: CollectionFieldSpecification<CollectionNameString>, fieldName: string, schema: SchemaType<CollectionNameString>) {
  // If field itself indicates it's an array
  if (field.type === Array)
    return true;

  // Check if there are sub-fields with the pattern fieldName.$
  const subFieldPattern = new RegExp(`^${fieldName}\\.\\$`);
  return Object.keys(schema).some(key => subFieldPattern.test(key));
}

function convertResolverOnlyField(
  field: FieldWithResolveAs,
  isArrayField: boolean,
  fieldName: string,
  collectionName: CollectionNameString,
) {
  const context = { field, fieldName, collectionName };
  const result: string[] = [];
  const graphqlSection = buildSection(graphqlProps, 'graphql', field, context);
  const formSection = buildSection(formProps, 'form', field, context);

  const graphqlContent = [
    ...graphqlSection,
    `    resolver: ${convertResolveAsFunction(context, 'resolver')},`,
  ];

  if (field.resolveAs.sqlResolver) {
    graphqlContent.push(`    sqlResolver: ${convertResolveAsFunction(context, 'sqlResolver')},`);
  }

  if (field.resolveAs.sqlPostProcess) {
    graphqlContent.push(`    sqlPostProcess: ${convertResolveAsFunction(context, 'sqlPostProcess')},`);
  }

  const typeValue = field.type !== undefined ?
    (isArrayField ? `    type: [${formatValue(field.type, context)}],` : `    type: ${formatValue(field.type, context)},`) : '';

  const content = `  ${fieldName}: {
    graphql: {
${typeValue}
${graphqlContent.join('\n')}
    },${formSection.length > 0 ? `
    form: {
${formSection.join('\n')}
    },` : ''}
  },`;

  result.push(content);

  return result;
}

function getGraphQLTypeString(schema: SchemaType<CollectionNameString>, fieldName: string) {
  const graphqlType = getGraphQLType(schema, fieldName);
  return `${spaces(6)}type: '${graphqlType}',`;
}

function getFieldTypeString(
  field: CollectionFieldSpecification<CollectionNameString>,
  isArrayField: boolean,
  fieldName: string,
  schema: SchemaType<CollectionNameString>,
  context: Omit<FieldValueSubstitutionProps, 'func'>,
) {
  let typeString = '';
  if (field.type !== undefined) {
    if (isArrayField) {
      // For array fields, we need to determine the element type
      const subFieldTypeKey = `${fieldName}.$`;
      const subFieldType = schema[subFieldTypeKey]?.type;

      if (subFieldType) {
        typeString = `      type: [${formatValue(subFieldType, context)}],`;
      } else {
        typeString = `      type: ["Any"],`;
      }
    } else {
      typeString = `      type: ${formatValue(field.type, context)},`;
    }
  }
  return typeString;
}

/**
 * Converts a field from old CollectionFieldSpecification format to new NewCollectionFieldSpecification format
 * Returns an array of strings, one for the base field and potentially one for the resolveAs field
 */
function convertFieldToNewFormat(
  fieldName: string,
  collectionName: CollectionNameString,
  field: CollectionFieldSpecification<CollectionNameString>,
  schema: SchemaType<CollectionNameString>,
): string[] {
  // Skip array sub-fields that contain $ symbol, as they will be handled differently
  if (fieldName.includes('.$')) {
    return []; // Return empty array for array sub-fields
  }

  const context = { field, fieldName, collectionName };

  // Check if this field is an array field
  const isArrayField = checkIfArrayField(field, fieldName, schema);

  // Special handling for type
  let typeString = getFieldTypeString(field, isArrayField, fieldName, schema, context);

  const result: string[] = [];

  // Handle resolver-only fields
  if (fieldHasResolveAs(field) && !field.resolveAs.addOriginalField) {
    return convertResolverOnlyField(field, isArrayField, fieldName, collectionName);
  }

  // Handle regular field (without resolveAs or with resolveAs.addOriginalField=true)
  const baseField = convertDatabaseField(typeString, field, isArrayField, fieldName, schema, collectionName);
  
  result.push(baseField);

  // Create separate entry for resolveAs field
  if (fieldHasResolveAs(field)) {
    const resolveAsField = extractAdditionalResolverField({ field, fieldName, collectionName });
    
    result.push(resolveAsField);
  }

  return result;
}


/**
 * Converts a schema from old format to new format and writes it to a file
 */
function convertSchemaToNewFormat(collectionName: CollectionNameString): void {
  console.log(`Converting schema for ${collectionName}...`);
  
  // Get the schema
  const schema = getSchema(collectionName);
  
  // Build the new schema file content
  let newSchemaContent = `// GENERATED FILE - DO NOT MODIFY DIRECTLY
// This is a generated file that has been converted from the old schema format to the new format.
// The original schema is still in use, this is just for reference.

const schema: Record<string, NewCollectionFieldSpecification<'${collectionName}'>> = {
`;

  // Get all the field names, but filter out array sub-fields (those containing .$)
  const regularFieldNames = Object.keys(schema).filter(fieldName => !fieldName.includes('.$'));

  // Convert each field
  for (const fieldName of regularFieldNames) {
    if (Object.prototype.hasOwnProperty.call(schema, fieldName)) {
      const field = schema[fieldName];
      const convertedFields = convertFieldToNewFormat(fieldName, collectionName, field, schema);
      newSchemaContent += convertedFields.join('\n') + '\n';
    }
  }

  newSchemaContent += `};

export default schema;
`;

  // Determine the output path
  const collectionDir = findCollectionDir(collectionName);
  if (!collectionDir) {
    console.warn(`Could not find collection directory for ${collectionName}, skipping...`);
    return;
  }

  const outputPath = path.join(collectionDir, 'newSchema.ts');
  
  // Write the new schema file
  fs.writeFileSync(outputPath, newSchemaContent);
  console.log(`Wrote new schema to ${outputPath}`);
}

/**
 * Find the directory where a collection's schema is stored
 */
function findCollectionDir(collectionName: CollectionNameString): string | null {
  // Convert from CamelCase to kebab-case
  const kebabName = collectionName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  
  // First try the kebab-case version
  const kebabPath = path.join(collectionBasePath, kebabName);
  if (fs.existsSync(kebabPath)) {
    return kebabPath;
  }
  
  // Then try the lowercase version
  const lowerPath = path.join(collectionBasePath, collectionName.toLowerCase());
  if (fs.existsSync(lowerPath)) {
    return lowerPath;
  }
  
  // Try to find directory with similar name
  const dirs = fs.readdirSync(collectionBasePath);
  for (const dir of dirs) {
    if (dir.toLowerCase() === collectionName.toLowerCase() || 
        dir.toLowerCase().replace(/-/g, '') === collectionName.toLowerCase()) {
      return path.join(collectionBasePath, dir);
    }
  }
  
  return null;
}

for (const collectionName in allSchemas) {
  if (Object.prototype.hasOwnProperty.call(allSchemas, collectionName)) {
    convertSchemaToNewFormat(collectionName as CollectionNameString);
  }
}
