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
 */
function convertFieldToNewFormat(fieldName: string, field: CollectionFieldSpecification<CollectionNameString>): string {
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

  // Type is required for both database and graphql
  const type = field.type ? `type: ${JSON.stringify(field.type)}` : '';
  
  // Build database section
  const databaseSection = databaseProps
    .filter(prop => prop !== 'type' && field[prop] !== undefined)
    .map(prop => `    ${prop}: ${JSON.stringify(field[prop])},`);

  // Build graphql section
  const graphqlSection = graphqlProps
    .filter(prop => field[prop] !== undefined)
    .map(prop => `    ${prop}: ${JSON.stringify(field[prop])},`);
  
  // Build form section
  const formSection = formProps
    .filter(prop => field[prop] !== undefined)
    .map(prop => `    ${prop}: ${JSON.stringify(field[prop])},`);

  // Handle resolver-only fields
  if (field.resolveAs && !field.resolveAs.addOriginalField) {
    return `  ${fieldName}: {
    graphql: {
      type: ${JSON.stringify(field.type)},
${graphqlSection.join('\n')}
      resolver: ${field.resolveAs.resolver.toString()},
${field.resolveAs.sqlResolver ? `      sqlResolver: ${field.resolveAs.sqlResolver.toString()},` : ''}
${field.resolveAs.sqlPostProcess ? `      sqlPostProcess: ${field.resolveAs.sqlPostProcess.toString()},` : ''}
    },
    form: {
${formSection.join('\n')}
    },
  },`;
  }

  // Handle resolveAs fields
  if (field.resolveAs) {
    return `  ${fieldName}: {
    database: {
      ${type ? type + ',' : ''}
${databaseSection.join('\n')}
    },
    graphql: {
      type: ${JSON.stringify(field.type)},
${graphqlSection.join('\n')}
      resolveAs: {
        type: ${JSON.stringify(field.resolveAs.type)},
        ${field.resolveAs.fieldName ? `fieldName: ${JSON.stringify(field.resolveAs.fieldName)},` : ''}
        ${field.resolveAs.addOriginalField ? `addOriginalField: true,` : ''}
        ${field.resolveAs.arguments ? `arguments: ${JSON.stringify(field.resolveAs.arguments)},` : ''}
        resolver: ${field.resolveAs.resolver.toString()},
${field.resolveAs.sqlResolver ? `        sqlResolver: ${field.resolveAs.sqlResolver.toString()},` : ''}
${field.resolveAs.sqlPostProcess ? `        sqlPostProcess: ${field.resolveAs.sqlPostProcess.toString()},` : ''}
      },
    },
    form: {
${formSection.join('\n')}
    },
  },`;
  }

  // Regular field
  return `  ${fieldName}: {
    database: {
      ${type ? type + ',' : ''}
${databaseSection.join('\n')}
    },
    graphql: {
      type: ${JSON.stringify(field.type)},
${graphqlSection.join('\n')}
    },
    form: {
${formSection.join('\n')}
    },
  },`;
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

  // Convert each field
  for (const fieldName in schema) {
    if (Object.prototype.hasOwnProperty.call(schema, fieldName)) {
      const field = schema[fieldName];
      newSchemaContent += convertFieldToNewFormat(fieldName, field) + '\n';
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

// Convert all schemas
console.log('Starting schema conversion...');
for (const collectionName in allSchemas) {
  if (Object.prototype.hasOwnProperty.call(allSchemas, collectionName)) {
    convertSchemaToNewFormat(collectionName as CollectionNameString);
  }
}
console.log('Schema conversion complete!'); 