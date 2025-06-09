import path from 'path';
import { existsSync } from 'fs';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { getSingleResolverName } from '@/lib/crud/utils';

function uncapitalize(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function getTypeName(collectionName: string) {
  return collectionName.slice(0, -1);
}

function getSchemaFile(collectionName: string) {
  return `import { DEFAULT_CREATED_AT_FIELD, DEFAULT_ID_FIELD } from "@/lib/collections/helpers/sharedFieldConstants";

const schema = {
  _id: DEFAULT_ID_FIELD,
  createdAt: DEFAULT_CREATED_AT_FIELD,

  // Add your collection's fields here
} satisfies Record<string, NewCollectionFieldSpecification<"${collectionName}">>;

export default schema;
`;
}

function getViewFile(collectionName: string) {
  return `import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ${collectionName}ViewTerms extends ViewTermsBase {
    view?: ${collectionName}ViewName
    // Add your view terms here
  }
}

// Define your view functions here

export const ${collectionName}Views = new CollectionViewSet('${collectionName}', {
  // Add your view functions here
});
`;
}

function getTypeDefsVariableName(collectionName: string) {
  const typeName = getTypeName(collectionName);
  const typeDefsVariableName = `graphql${typeName}QueryTypeDefs`;

  return typeDefsVariableName;
}

function getFieldResolversVariableName(collectionName: string) {
  const typeName = getTypeName(collectionName);
  const singleResolverName = getSingleResolverName(typeName);
  const fieldResolversVariableName = `${singleResolverName}GqlFieldResolvers`;

  return fieldResolversVariableName;
}

function getQueryFile(collectionName: string) {
  const typeDefsVariableName = getTypeDefsVariableName(collectionName);
  const fieldResolversVariableName = getFieldResolversVariableName(collectionName);

  const typeName = getTypeName(collectionName);
  const collectionPathPart = uncapitalize(collectionName);

  const fileContents = `import schema from "@/lib/collections/${collectionPathPart}/newSchema";
import { getAllGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { getFieldGqlResolvers } from "@/server/vulcan-lib/apollo-server/helpers";
import gql from "graphql-tag";

export const ${typeDefsVariableName} = gql\`
  type ${typeName} {
    \${getAllGraphQLFields(schema)}
  }
\`;

export const ${fieldResolversVariableName} = getFieldGqlResolvers('${collectionName}', schema);
`;

  return fileContents;
}

function getCollectionFile(collectionName: string) {
  const typeName = getTypeName(collectionName);

  return `import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

export const ${collectionName}: ${collectionName}Collection = createCollection({
  collectionName: '${collectionName}',
  typeName: '${typeName}',

  // This is where you can add indexes for the collection.
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    return indexSet;
  },
});


export default ${collectionName};
`;
}

async function insertIntoAllSchemas(collectionName: string) {
  // Read allSchemas.ts
  const allSchemasPath = path.join(__dirname, '..', '..', 'lib', 'schema', 'allSchemas.ts');
  const allSchemas = await readFile(allSchemasPath, 'utf8');
  const lines = allSchemas.split('\n');
  
  const collectionNameLower = uncapitalize(collectionName);
  const importLine = `import { default as ${collectionName} } from '../collections/${collectionNameLower}/newSchema';`;
  
  // Find the "Collection imports" section
  const collectionImportsIndex = lines.findIndex(line => line.includes('// Collection imports'));
  if (collectionImportsIndex === -1) {
    throw new Error('Could not find Collection imports section');
  }
  
  // Find where to insert the import statement alphabetically in the Collection imports section
  let importIndex = collectionImportsIndex + 1;
  while (importIndex < lines.length && 
         lines[importIndex].startsWith('import') && 
         lines[importIndex].localeCompare(importLine) < 0) {
    importIndex++;
  }
  
  // Insert the import statement
  lines.splice(importIndex, 0, importLine);
  
  // Find the allSchemas object definition
  const schemaObjectStartIndex = lines.findIndex(line => line.includes('export const allSchemas = {'));
  if (schemaObjectStartIndex === -1) {
    throw new Error('Could not find allSchemas object in file');
  }
  
  // Find the closing brace of the allSchemas object
  const schemaObjectEndIndex = lines.findIndex((line, idx) => 
    idx > schemaObjectStartIndex && line.includes('} satisfies'));
  if (schemaObjectEndIndex === -1) {
    throw new Error('Could not find closing brace of allSchemas object');
  }
  
  // Extract the schema line(s)
  const schemaLines = lines.slice(schemaObjectStartIndex + 1, schemaObjectEndIndex);
  
  // Parse all collection names from schema lines
  let allCollectionNames: string[] = [];
  let testSchemasLine = '';
  
  for (const line of schemaLines) {
    const trimmed = line.trim();
    
    // Skip empty lines or comments
    if (trimmed === '' || trimmed.startsWith('//')) {
      continue;
    }
    
    // Capture and skip testSchemas spread
    if (trimmed.includes('...testSchemas')) {
      testSchemasLine = trimmed;
      continue;
    }
    
    // Extract collection names from the line
    const withoutTrailingComma = trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;
    const names = withoutTrailingComma.split(',').map(n => n.trim()).filter(n => n !== '');
    allCollectionNames.push(...names);
  }
  
  // Add the new collection and sort
  allCollectionNames.push(collectionName);
  allCollectionNames.sort();
  
  // Build the new schema lines with 10 collection names per line
  const newSchemaLines: string[] = [];
  for (let i = 0; i < allCollectionNames.length; i += 10) {
    const chunk = allCollectionNames.slice(i, i + 10);
    newSchemaLines.push(`  ${chunk.join(', ')}${i + 10 < allCollectionNames.length || testSchemasLine ? ',' : ''}`);
  }
  
  // Add testSchemas if it was found
  if (testSchemasLine) {
    newSchemaLines.push(`  ${testSchemasLine}`);
  }
  
  // Rebuild the file
  const beforeSchema = lines.slice(0, schemaObjectStartIndex + 1);
  const afterSchema = lines.slice(schemaObjectEndIndex);
  
  const updatedLines = [...beforeSchema, ...newSchemaLines, ...afterSchema];
  
  // Write the file back
  await writeFile(allSchemasPath, updatedLines.join('\n'));
  
  // eslint-disable-next-line no-console
  console.log(`Updated allSchemas.ts with ${collectionName}`);

  return allSchemasPath;
}

async function insertIntoAllCollections(collectionName: string) {
  const allCollectionsPath = path.join(__dirname, '..', '..', 'server', 'collections', 'allCollections.ts');
  const allCollections = await readFile(allCollectionsPath, 'utf8');
  const lines = allCollections.split('\n');
  
  const collectionNameLower = uncapitalize(collectionName);
  const importLine = `import { ${collectionName} } from './${collectionNameLower}/collection';`;
  
  // Find the "Collection imports" section
  const collectionImportsIndex = lines.findIndex(line => line.includes('// Collection imports'));
  if (collectionImportsIndex === -1) {
    throw new Error('Could not find Collection imports section');
  }
  
  // Find where to insert the import statement alphabetically in the Collection imports section
  let importIndex = collectionImportsIndex + 1;
  while (importIndex < lines.length && 
         lines[importIndex].startsWith('import') && 
         lines[importIndex].localeCompare(importLine) < 0) {
    importIndex++;
  }
  
  // Insert the import statement
  lines.splice(importIndex, 0, importLine);
  
  // Find the allCollections object definition
  const collectionsObjectStartIndex = lines.findIndex(line => line.includes('const allCollections = {'));
  if (collectionsObjectStartIndex === -1) {
    throw new Error('Could not find allCollections object in file');
  }
  
  // Find the closing brace of the allCollections object
  const collectionsObjectEndIndex = lines.findIndex((line, idx) => 
    idx > collectionsObjectStartIndex && line.includes('} satisfies'));
  if (collectionsObjectEndIndex === -1) {
    throw new Error('Could not find closing brace of allCollections object');
  }
  
  // Extract the collections line(s)
  const collectionLines = lines.slice(collectionsObjectStartIndex + 1, collectionsObjectEndIndex);
  
  // Parse all collection names from collection lines
  let allCollectionNames: string[] = [];
  let testCollectionsLine = '';
  
  for (const line of collectionLines) {
    const trimmed = line.trim();
    
    // Skip empty lines or comments
    if (trimmed === '' || trimmed.startsWith('//')) {
      continue;
    }
    
    // Capture and skip testCollections spread
    if (trimmed.includes('...testCollections')) {
      testCollectionsLine = trimmed;
      continue;
    }
    
    // Extract collection names from the line
    const withoutTrailingComma = trimmed.endsWith(',') ? trimmed.slice(0, -1) : trimmed;
    const names = withoutTrailingComma.split(',').map(n => n.trim()).filter(n => n !== '');
    allCollectionNames.push(...names);
  }
  
  // Add the new collection and sort
  allCollectionNames.push(collectionName);
  allCollectionNames.sort();
  
  // Build the new collection lines with 10 collection names per line
  const newCollectionLines: string[] = [];
  for (let i = 0; i < allCollectionNames.length; i += 10) {
    const chunk = allCollectionNames.slice(i, i + 10);
    newCollectionLines.push(`  ${chunk.join(', ')}${i + 10 < allCollectionNames.length || testCollectionsLine ? ',' : ''}`);
  }
  
  // Add testCollections if it was found
  if (testCollectionsLine) {
    newCollectionLines.push(`  ${testCollectionsLine}`);
  }
  
  // Rebuild the file
  const beforeCollections = lines.slice(0, collectionsObjectStartIndex + 1);
  const afterCollections = lines.slice(collectionsObjectEndIndex);
  
  const updatedLines = [...beforeCollections, ...newCollectionLines, ...afterCollections];
  
  // Write the file back
  await writeFile(allCollectionsPath, updatedLines.join('\n'));
  
  // eslint-disable-next-line no-console
  console.log(`Updated allCollections.ts with ${collectionName}`);

  return allCollectionsPath;
}

async function insertIntoAllViews(collectionName: string) {
  const allViewsPath = path.join(__dirname, '..', '..', 'lib', 'views', 'allViews.ts');
  const allViews = await readFile(allViewsPath, 'utf8');
  const lines = allViews.split('\n');
  
  const collectionNameLower = uncapitalize(collectionName);
  const importLine = `import { ${collectionName}Views } from '../collections/${collectionNameLower}/views';`;
  
  // Find the "Collection imports" section
  const collectionImportsIndex = lines.findIndex(line => line.includes('// Collection imports'));
  if (collectionImportsIndex === -1) {
    throw new Error('Could not find Collection imports section');
  }
  
  // Find where to insert the import statement alphabetically in the Collection imports section
  let importIndex = collectionImportsIndex + 1;
  while (importIndex < lines.length && 
         lines[importIndex].startsWith('import') && 
         lines[importIndex].localeCompare(importLine) < 0) {
    importIndex++;
  }
  
  // Insert the import statement
  lines.splice(importIndex, 0, importLine);
  
  // Find the allViews object definition
  const viewsObjectStartIndex = lines.findIndex(line => line.includes('export const allViews = {'));
  if (viewsObjectStartIndex === -1) {
    throw new Error('Could not find allViews object in file');
  }
  
  // Find the closing brace of the allViews object
  const viewsObjectEndIndex = lines.findIndex((line, idx) => 
    idx > viewsObjectStartIndex && line.trim() === '};');
  if (viewsObjectEndIndex === -1) {
    throw new Error('Could not find closing brace of allViews object');
  }
  
  // Build the new view entry
  const viewEntry = `  ${collectionName}: ${collectionName}Views,`;
  
  // Find the correct position to insert the entry (alphabetically)
  let insertPosition = viewsObjectStartIndex + 1;
  for (let i = viewsObjectStartIndex + 1; i < viewsObjectEndIndex; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('//')) continue;
    
    const match = line.match(/^(\w+):/);
    if (match && match[1]) {
      if (match[1].localeCompare(collectionName) < 0) {
        insertPosition = i + 1;
      } else {
        break;
      }
    }
  }
  
  // Insert the view entry
  lines.splice(insertPosition, 0, viewEntry);
  
  // Write the file back
  await writeFile(allViewsPath, lines.join('\n'));
  
  // eslint-disable-next-line no-console
  console.log(`Updated allViews.ts with ${collectionName}`);

  return allViewsPath;
}

async function insertIntoInitGraphQL(collectionName: string) {
  const initGraphQLPath = path.join(__dirname, '..', '..', 'server', 'vulcan-lib', '@apollo/server', 'initGraphQL.ts');
  const initGraphQL = await readFile(initGraphQLPath, 'utf8');
  const lines = initGraphQL.split('\n');

  const collectionNameLower = uncapitalize(collectionName);
  const typeDefsVariableName = getTypeDefsVariableName(collectionName);
  const fieldResolversVariableName = getFieldResolversVariableName(collectionName);
  const importLine = `import { ${typeDefsVariableName}, ${fieldResolversVariableName} } from "@/server/collections/${collectionNameLower}/queries";`;

  const collectionImportsIndex = lines.findIndex(line => line.includes('// Collection imports'));
  if (collectionImportsIndex === -1) {
    throw new Error('Could not find Collection imports section');
  }
  
  // Find where to insert the import statement alphabetically in the Collection imports section
  let importIndex = collectionImportsIndex + 1;
  while (importIndex < lines.length && 
          lines[importIndex].startsWith('import') && 
          lines[importIndex].localeCompare(importLine) < 0) {
    importIndex++;
  }

  // Insert the import statement
  lines.splice(importIndex, 0, importLine);
  
  // Find the "CRUD Query typedefs" section
  const crudQueryTypeDefsIndex = lines.findIndex(line => line.includes('## CRUD Query typedefs'));
  if (crudQueryTypeDefsIndex === -1) {
    throw new Error('Could not find CRUD Query typedefs section');
  }

  const crudTypeDefsLine = `  \${${typeDefsVariableName}}`;
  
  // Find where to insert the imported typeDefs alphabetically in the CRUD Query typedefs section
  let insertTypeDefsIndex = crudQueryTypeDefsIndex + 1;
  while (insertTypeDefsIndex < lines.length && 
         lines[insertTypeDefsIndex].trim().startsWith('${graphql') && 
         lines[insertTypeDefsIndex].localeCompare(crudTypeDefsLine) < 0) {
    insertTypeDefsIndex++;
  }

  lines.splice(insertTypeDefsIndex, 0, crudTypeDefsLine);

  // Find the "Collection Field Resolvers" section
  const collectionFieldResolversIndex = lines.findIndex(line => line.includes('// Collection Field Resolvers'));
  if (collectionFieldResolversIndex === -1) {
    throw new Error('Could not find Collection Field Resolvers section');
  }

  const collectionFieldResolversLine = `  ...${fieldResolversVariableName},`;
  
  // Find where to insert the imported fieldResolvers alphabetically in the Collection Field Resolvers section
  let insertFieldResolversIndex = collectionFieldResolversIndex + 1;
  while (insertFieldResolversIndex < lines.length && 
         lines[insertFieldResolversIndex].trim().startsWith('...') && 
         lines[insertFieldResolversIndex].localeCompare(collectionFieldResolversLine) < 0) {
    insertFieldResolversIndex++;
  }

  lines.splice(insertFieldResolversIndex, 0, collectionFieldResolversLine);

  // Write the file back
  await writeFile(initGraphQLPath, lines.join('\n'));

  // eslint-disable-next-line no-console
  console.log(`Updated initGraphQL.ts with ${collectionName}`);

  return initGraphQLPath;
}

async function insertIntoAccessFilters(collectionName: string) {
  const accessFiltersPath = path.join(__dirname, '..', '..', 'server', 'permissions', 'accessFilters.ts');
  const accessFilters = await readFile(accessFiltersPath, 'utf8');
  const lines = accessFilters.split('\n');

  // Find the accessFilters object definition
  const accessFiltersObjectStartIndex = lines.findIndex(line => line.includes('const accessFilters = {'));
  if (accessFiltersObjectStartIndex === -1) {
    throw new Error('Could not find accessFilters object in file');
  }

  // Find the closing brace of the accessFilters object
  const accessFiltersObjectEndIndex = lines.findIndex((line, idx) => 
    idx > accessFiltersObjectStartIndex && line.trim() === '} satisfies Record<CollectionNameString, CheckAccessFunction<CollectionNameString>>;');
  if (accessFiltersObjectEndIndex === -1) {
    throw new Error('Could not find closing brace of accessFilters object');
  }

  // Build the new accessFilter entry and insert the default (reject) access filter
  const accessFilterEntry = `  ${collectionName}: defaultCheckAccess,`;
  
  // Find the correct position to insert the entry (alphabetically)
  let insertPosition = accessFiltersObjectStartIndex + 1;
  for (let i = accessFiltersObjectStartIndex + 1; i < accessFiltersObjectEndIndex; i++) {
    const line = lines[i].trim();
    if (line === '' || line.startsWith('//')) continue;
    
    const match = line.match(/^(\w+):/);
    if (match && match[1]) {
      if (match[1].localeCompare(collectionName) < 0) {
        insertPosition = i + 1;
      } else {
        break;
      }
    }
  }

  // Insert the new accessFilter entry
  lines.splice(insertPosition, 0, accessFilterEntry);

  // Write the file back
  await writeFile(accessFiltersPath, lines.join('\n'));

  // eslint-disable-next-line no-console
  console.log(`Updated accessFilters.ts with ${collectionName}.  NOTE: if you want records in this collection to be accessible via the API, you need to add a custom access filter function (or use the allowAccess function).`);

  return accessFiltersPath;
}

export async function generateNewCollection(collectionName?: string) {
  if (!collectionName?.endsWith('s')) {
    // eslint-disable-next-line no-console
    console.error(`Collection name must end with an 's', provided name: ${collectionName}`);
    process.exit(1);
  }

  const collectionNameLower = uncapitalize(collectionName);
  const libDirExists = existsSync(path.join(__dirname, '..', '..', 'lib', 'collections', collectionNameLower));
  const serverDirExists = existsSync(path.join(__dirname, '..', '..', 'server', 'collections', collectionNameLower));

  if (libDirExists || serverDirExists) {
    // eslint-disable-next-line no-console
    console.error(`Collection ${collectionName} already exists in lib and/or server`);
    process.exit(1);
  }

  const schemaFile = getSchemaFile(collectionName);
  const viewFile = getViewFile(collectionName);
  const queryFile = getQueryFile(collectionName);
  const collectionFile = getCollectionFile(collectionName);

  const libPath = path.join(__dirname, '..', '..', 'lib', 'collections', uncapitalize(collectionName));
  const serverPath = path.join(__dirname, '..', '..', 'server', 'collections', uncapitalize(collectionName));

  // eslint-disable-next-line no-console
  console.log(`Creating ${collectionName} in ${libPath} and ${serverPath}`);
  await mkdir(libPath, { recursive: true });
  await mkdir(serverPath, { recursive: true });

  await Promise.all([
    writeFile(path.join(libPath, 'newSchema.ts'), schemaFile),
    writeFile(path.join(libPath, 'views.ts'), viewFile),
    writeFile(path.join(serverPath, 'queries.ts'), queryFile),
    writeFile(path.join(serverPath, 'collection.ts'), collectionFile),
  ]);

  // eslint-disable-next-line no-console
  console.log('Updating allCollections.ts, allViews.ts, allSchemas.ts, initGraphQL.ts, and accessFilters.ts');
  const [allCollectionsPath, allViewsPath, allSchemasPath, initGraphQLPath, accessFiltersPath] = await Promise.all([
    insertIntoAllCollections(collectionName),
    insertIntoAllViews(collectionName),
    insertIntoAllSchemas(collectionName),
    insertIntoInitGraphQL(collectionName),
    insertIntoAccessFilters(collectionName),
  ]);

  // eslint-disable-next-line no-console
  console.log(`
    Collection ${collectionName} created successfully.
    Files created at:
      ${libPath}
      ${serverPath}
    Files modified:
      ${allCollectionsPath}
      ${allViewsPath}
      ${allSchemasPath}
      ${initGraphQLPath}
      ${accessFiltersPath}
  `);
  // eslint-disable-next-line no-console
  console.log('Now running `yarn generate`...');
}
