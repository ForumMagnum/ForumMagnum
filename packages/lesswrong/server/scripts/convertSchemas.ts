import * as fs from 'fs';
import * as path from 'path';
import { allSchemas, getSchema } from '../../lib/schema/allSchemas';
import { augmentSchemas } from '../resolvers/allFieldAugmentations';

// Run the augmentSchemas function to make sure all schemas are properly augmented
augmentSchemas();

// Base directory where collection schemas are stored
const collectionBasePath = path.join(__dirname, '../../lib/collections');

/**
 * Converts a field from old CollectionFieldSpecification format to new NewCollectionFieldSpecification format
 * Returns an array of strings, one for the base field and potentially one for the resolveAs field
 */
function convertFieldToNewFormat(fieldName: string, field: CollectionFieldSpecification<CollectionNameString>, schema: any): string[] {
  // Skip array sub-fields that contain $ symbol, as they will be handled differently
  if (fieldName.includes('.$')) {
    return []; // Return empty array for array sub-fields
  }

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
    'canUpdate',
    'canCreate',
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

  // Helper function to build a section with properties
  const buildSection = (props: readonly string[], section: string): string[] => {
    const lines: string[] = [];
    
    for (const prop of props) {
      if (prop === 'type' && section === 'database') continue; // Handle type separately for database
      
      // Use type assertion since we know these properties are part of the schema
      const value = (field as any)[prop];
      if (value !== undefined) {
        // Pass the property name to formatValue so it can make context-specific decisions
        lines.push(`    ${prop}: ${formatValue(value, prop)},`);
      }
    }
    
    return lines;
  };

  // Helper function to properly format a value
  const formatValue = (value: any, propertyName?: string): string => {
    if (value === undefined || value === null) {
      return '';
    }
    
    // Special case for function fields that should preserve their implementation
    const functionImplementationFields = ['onCreate', 'onUpdate', 'onDelete', 'getValue', 'resolver', 'sqlResolver', 'sqlPostProcess', 'needsUpdate'];
    const shouldPreserveFunctionImpl = propertyName && functionImplementationFields.includes(propertyName);
    
    // Handle arrays specially to properly handle functions within arrays
    if (Array.isArray(value)) {
      // For array items, we don't have property names, so always use simplified function format
      const formattedElements = value.map(element => formatValue(element));
      return `[${formattedElements.join(', ')}]`;
    }
    
    // Handle functions specially
    if (typeof value === 'function') {
      if (value === String) return '"String"';
      if (value === Number) return '"Number"';
      if (value === Boolean) return '"Boolean"';
      if (value === Date) return '"Date"';
      if (value === Object) return '"Object"';
      if (value === Array) return '"Array"';
      
      // For function implementation fields, preserve the full implementation
      if (shouldPreserveFunctionImpl) {
        return value.toString();
      }
      
      // For named functions, preserve the function name
      if (value.name && value.name !== 'anonymous') {
        return `"function:${value.name}"`;
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
        if (keys.length <= 5) {
          const props = keys.map(key => {
            // Pass undefined as property name for nested properties, as we don't need special handling
            const propValue = formatValue(value[key], undefined);
            return `"${key}": ${propValue}`;
          });
          return `{${props.join(', ')}}`;
        }
        
        // For larger objects, just return a placeholder
        return `"{Object with ${keys.length} properties}"`;
      } catch (e) {
        // Fallback to default JSON if we encounter any issues
        return JSON.stringify(value);
      }
    }
    
    return JSON.stringify(value);
  };

  // Check if this field is an array field
  const isArrayField = (() => {
    // If field itself indicates it's an array
    if (field.type === Array) return true;
    
    // Check if there are sub-fields with the pattern fieldName.$
    const subFieldPattern = new RegExp(`^${fieldName}\\.\\$`);
    return Object.keys(schema).some(key => subFieldPattern.test(key));
  })();

  // Special handling for type
  let typeString = '';
  if (field.type !== undefined) {
    if (isArrayField) {
      // For array fields, we need to determine the element type
      const subFieldTypeKey = `${fieldName}.$`;
      const subFieldType = schema[subFieldTypeKey]?.type;
      
      if (subFieldType) {
        typeString = `    type: [${formatValue(subFieldType)}],`;
      } else {
        typeString = `    type: ["Any"],`;
      }
    } else {
      typeString = `    type: ${formatValue(field.type)},`;
    }
  }
  
  // Build database section
  const databaseSection = buildSection(databaseProps, 'database');
  
  // Build graphql section
  const graphqlSection = buildSection(graphqlProps, 'graphql');
  
  // Build form section
  const formSection = buildSection(formProps, 'form');

  const result: string[] = [];

  // Handle resolver-only fields
  if (field.resolveAs && !field.resolveAs.addOriginalField) {
    const graphqlContent = [
      ...graphqlSection,
      `    resolver: ${field.resolveAs.resolver.toString()},`,
    ];
    
    if (field.resolveAs.sqlResolver) {
      graphqlContent.push(`    sqlResolver: ${field.resolveAs.sqlResolver.toString()},`);
    }
    
    if (field.resolveAs.sqlPostProcess) {
      graphqlContent.push(`    sqlPostProcess: ${field.resolveAs.sqlPostProcess.toString()},`);
    }
    
    const typeValue = field.type !== undefined ? 
      (isArrayField ? `    type: [${formatValue(field.type)}],` : `    type: ${formatValue(field.type)},`) : '';
    
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

  // Handle regular field (without resolveAs or with resolveAs.addOriginalField=true)
  const databaseContent = typeString ? [typeString, ...databaseSection] : databaseSection;
  const typeValueForGraphQL = field.type !== undefined ? 
    (isArrayField ? `    type: [${formatValue(field.type)}],` : `    type: ${formatValue(field.type)},`) : '';
  
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
  
  result.push(baseField);

  // Create separate entry for resolveAs field
  if (field.resolveAs) {
    const resolveAsFieldName = field.resolveAs.fieldName || `${fieldName}Resolved`;
    
    const graphqlResolveAsContent = [];
    
    if (field.resolveAs.type) {
      graphqlResolveAsContent.push(`    type: ${formatValue(field.resolveAs.type)},`);
    }
    
    if (field.canRead) {
      graphqlResolveAsContent.push(`    canRead: ${formatValue(field.canRead)},`);
    }
    
    if (field.resolveAs.arguments !== undefined) {
      graphqlResolveAsContent.push(`    arguments: ${formatValue(field.resolveAs.arguments)},`);
    }
    
    graphqlResolveAsContent.push(`    resolver: ${field.resolveAs.resolver.toString()},`);
    
    if (field.resolveAs.sqlResolver) {
      graphqlResolveAsContent.push(`    sqlResolver: ${field.resolveAs.sqlResolver.toString()},`);
    }
    
    if (field.resolveAs.sqlPostProcess) {
      graphqlResolveAsContent.push(`    sqlPostProcess: ${field.resolveAs.sqlPostProcess.toString()},`);
    }
    
    const resolveAsField = `  ${resolveAsFieldName}: {
    graphql: {
${graphqlResolveAsContent.join('\n')}
    },
    form: {
      hidden: true,
    },
  },`;
    
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

import { NewCollectionFieldSpecification } from '@/lib/types/schemaTypes';

const schema: Record<string, NewCollectionFieldSpecification<'${collectionName}'>> = {
`;

  // Get all the field names, but filter out array sub-fields (those containing .$)
  const regularFieldNames = Object.keys(schema).filter(fieldName => !fieldName.includes('.$'));

  // Convert each field
  for (const fieldName of regularFieldNames) {
    if (Object.prototype.hasOwnProperty.call(schema, fieldName)) {
      const field = schema[fieldName];
      const convertedFields = convertFieldToNewFormat(fieldName, field, schema);
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