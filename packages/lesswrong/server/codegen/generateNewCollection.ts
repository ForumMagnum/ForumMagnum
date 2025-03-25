import path from 'path';
import { existsSync } from 'fs';
import { writeFile, mkdir, readFile } from 'fs/promises';

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

function getFragmentFile(collectionName: string) {
  return `// This file is a currently a stub,
// but it's fine to leave it in place so that nobody is confused about whether fragments exist for this collection or not.

// Delete this line once you add a fragment for this collection.
export default {};
`;
}

function getCollectionFile(collectionName: string) {
  const collectionNameLower = uncapitalize(collectionName);
  const typeName = getTypeName(collectionName);

  return `import { createCollection } from '@/lib/vulcan-lib/collections';
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

/**
 * If this collection wants to allow users to create/update records, uncomment the following lines
 * and implement the check functions for newCheck, editCheck, and removeCheck.  (removeCheck should by default return false.)
 * Otherwise, delete this block.
 */
// const mutationOptions = {
//   newCheck: async (user: DbUser | null, document: Db${typeName} | null, context: ResolverContext) => {
//     return false;
//   },
//   editCheck: async (user: DbUser | null, document: Db${typeName} | null, context: ResolverContext) => {
//     return false;
//   },
//   removeCheck: async (user: DbUser | null, document: Db${typeName} | null, context: ResolverContext) => {
//     return false;
//   },
// };

export const ${collectionName}: ${collectionName}Collection = createCollection({
  collectionName: '${collectionName}',
  typeName: '${typeName}',

  // This is where you can add indexes for the collection.
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    return indexSet;
  },

  /** 
   * If this collection wants to be used for basic CRUD operations, uncomment the following lines and import the necessary functions.
   * Otherwise, remove them.
   */
  // resolvers: getDefaultResolvers('${collectionNameLower}'),
  // mutations: getDefaultMutations('${collectionNameLower}', mutationOptions),

  /**
   * If you want to log field changes by default for all fields in this collection, uncomment the following line.
   * Otherwise, remove it.  You can also set logChanges to true for specific fields in the schema.
   */
  // logChanges: true,
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

async function insertIntoAllFragments(collectionName: string) {
  const allFragmentsPath = path.join(__dirname, '..', '..', 'lib', 'fragments', 'allFragments.ts');
  const allFragments = await readFile(allFragmentsPath, 'utf8');
  const lines = allFragments.split('\n');
  
  const collectionNameLower = uncapitalize(collectionName);
  const importLine = `import * as ${collectionNameLower}Fragments from '../collections/${collectionNameLower}/fragments';`;
  
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
  
  // Check if the fragments file is a stub (default export is undefined)
  const fragmentsFilePath = path.join(__dirname, '..', '..', 'lib', 'collections', collectionNameLower, 'fragments.ts');
  let isStubFragment = false;
  
  try {
    const fragmentsFileContent = await readFile(fragmentsFilePath, 'utf8');
    // Check if the file contains a pattern indicating it's a stub
    isStubFragment = fragmentsFileContent.includes('export default undefined') || 
                     fragmentsFileContent.includes('// This file is a currently a stub');
  } catch (e) {
    // If file doesn't exist or can't be read, treat as a stub
    isStubFragment = true;
  }
  
  // Find the "Collection fragments" section in staticFragments
  const collectionFragmentsIndex = lines.findIndex(line => line.includes('// Collection fragments'));
  if (collectionFragmentsIndex === -1) {
    throw new Error('Could not find Collection fragments section in staticFragments');
  }
  
  // Find the end of the Collection fragments section
  const nonCollectionFragmentsIndex = lines.findIndex((line, idx) => 
    idx > collectionFragmentsIndex && line.includes('// Non-collection fragments'));
  if (nonCollectionFragmentsIndex === -1) {
    throw new Error('Could not find end of Collection fragments section');
  }
  
  // Create the spread line, commenting it out if it's a stub
  const spreadLine = isStubFragment
    ? `  // ...${collectionNameLower}Fragments,`
    : `  ...${collectionNameLower}Fragments,`;
  
  // Extract all current spread lines (both active and commented out)
  const fragmentsSection = lines.slice(collectionFragmentsIndex + 1, nonCollectionFragmentsIndex);
  
  // Check if there's an empty line at the end of the collection fragments section
  const hasEmptyLineAtEnd = fragmentsSection.length > 0 && 
                          fragmentsSection[fragmentsSection.length - 1].trim() === '';
  
  // Filter to get only the spread lines
  const spreadLines = fragmentsSection.filter(line => 
    line.trim().startsWith('...') || line.trim().startsWith('// ...')
  );
  
  // Add our new line and sort alphabetically by collection name
  spreadLines.push(spreadLine);
  spreadLines.sort((a, b) => {
    // Extract collection name from spread line, ignoring comments and spread operator
    const getCollectionName = (line: string) => {
      return line.replace(/^[\s]*\/\/[\s]*\.\.\./, '').replace(/^[\s]*\.\.\./, '').replace(/Fragments,.*$/, '');
    };
    return getCollectionName(a).localeCompare(getCollectionName(b));
  });
  
  // If there was an empty line at the end, add it back
  if (hasEmptyLineAtEnd) {
    spreadLines.push('');
  }
  
  // Build the new collection fragments section
  const beforeFragments = lines.slice(0, collectionFragmentsIndex + 1);
  const afterFragments = lines.slice(nonCollectionFragmentsIndex);
  
  // Rebuild the file with the updated fragments section
  const updatedLines = [
    ...beforeFragments,
    ...spreadLines,
    ...afterFragments
  ];
  
  // Write the file back
  await writeFile(allFragmentsPath, updatedLines.join('\n'));
  
  // eslint-disable-next-line no-console
  console.log(`Updated allFragments.ts with ${collectionName}`);

  return allFragmentsPath;
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
  const fragmentFile = getFragmentFile(collectionName);
  const collectionFile = getCollectionFile(collectionName);

  const libPath = path.join(__dirname, '..', '..', 'lib', 'collections', uncapitalize(collectionName));
  // eslint-disable-next-line no-console
  console.log(`Creating ${collectionName} in ${libPath}`);
  await mkdir(libPath, { recursive: true });

  await Promise.all([
    writeFile(path.join(libPath, 'newSchema.ts'), schemaFile),
    writeFile(path.join(libPath, 'views.ts'), viewFile),
    writeFile(path.join(libPath, 'fragments.ts'), fragmentFile),
  ]);

  const serverPath = path.join(__dirname, '..', '..', 'server', 'collections', uncapitalize(collectionName));
  // eslint-disable-next-line no-console
  console.log(`Creating ${collectionName} in ${serverPath}`);
  await mkdir(serverPath, { recursive: true });

  await writeFile(path.join(serverPath, 'collection.ts'), collectionFile);

  // eslint-disable-next-line no-console
  console.log('Updating allCollections.ts, allViews.ts, allFragments.ts, and allSchemas.ts');
  const [allCollectionsPath, allViewsPath, allFragmentsPath, allSchemasPath] = await Promise.all([
    insertIntoAllCollections(collectionName),
    insertIntoAllViews(collectionName),
    insertIntoAllFragments(collectionName),
    insertIntoAllSchemas(collectionName),
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
      ${allFragmentsPath}
      ${allSchemasPath}
  `);
  // eslint-disable-next-line no-console
  console.log('Now running `yarn generate`...');
}
