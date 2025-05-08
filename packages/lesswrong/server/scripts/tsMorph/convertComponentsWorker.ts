import {
  Project,
  SourceFile,
  SyntaxKind,
  ImportDeclaration,
  Identifier,
  PropertyAccessExpression,
  VariableDeclaration,
  Node,
  VariableStatement,
  CallExpression,
  StringLiteral,
  BindingElement,
  ExportAssignment,
  ts,
} from 'ts-morph';
import path from 'path';
import fs from 'fs';
import { startWorkerForBatch } from './tsMorphWorker';
import { workerData as currentWorkerData } from 'worker_threads';

// Cache for component locations
// Key: ComponentName (string used in Components.X or registerComponent)
// Value: { path: string; exportName: string; isDefault: boolean; }
let componentLocationCache: Map<string, { path: string; exportName: string; isDefault: boolean; }> | null = null;

const CACHE_FILE_NAME = '.component-cache.json'; // Define cache file name

function getRelativePath(fromPath: string, toPath: string): string {
  let relative = path.relative(path.dirname(fromPath), toPath);
  relative = relative.replace(/\.(tsx|ts|js|jsx)$/, ''); // Remove extension
  if (!relative.startsWith('.') && !relative.startsWith('..')) {
    relative = './' + relative;
  }
  return relative.replace(/\\/g, '/'); // Ensure forward slashes
}

async function initializeComponentCacheIfNeeded(projectForCache: Project) {
  if (componentLocationCache) return;

  const projectRootDir = path.dirname(__dirname);
  const cacheFilePath = path.join(projectRootDir, CACHE_FILE_NAME);

  // Try to load from file system cache
  if (fs.existsSync(cacheFilePath)) {
    try {
      console.log(`Worker: Attempting to load component cache from ${cacheFilePath}`);
      const fileContent = fs.readFileSync(cacheFilePath, 'utf-8');
      const parsedCache = JSON.parse(fileContent) as Array<[string, { path: string; exportName: string; isDefault: boolean; }]>;
      componentLocationCache = new Map(parsedCache);
      console.log(`Worker: Component cache loaded successfully from ${cacheFilePath} with ${componentLocationCache.size} components.`);
      // For debugging cache content:
      // componentLocationCache.forEach((v, k) => console.log(`CACHE (loaded): ${k} -> ${JSON.stringify(v)}`));
      return;
    } catch (error) {
      console.warn(`Worker: Failed to load component cache from ${cacheFilePath}. Will rebuild. Error:`, error);
      // Invalidate potentially corrupt cache file or handle error appropriately
      // For simplicity, we'll just proceed to rebuild. Could delete the corrupt file:
      // try { fs.unlinkSync(cacheFilePath); } catch (e) { console.warn(`Worker: Could not delete corrupt cache file ${cacheFilePath}`, e); }
      componentLocationCache = null; // Ensure it's reset if loading failed mid-way
    }
  }

  console.log(`Worker: Initializing component cache by scanning source files (cache file not found or loading failed).`);
  componentLocationCache = new Map<string, { path: string; exportName: string; isDefault: boolean; }>();
  const sourceFiles = projectForCache.getSourceFiles();

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();

    // 1. Handle standard named exports
    sourceFile.getExportedDeclarations().forEach((declarations, exportedName) => {
      // Check if this name is already cached as a default export from registerComponent.
      // If so, the default export version (linked to the registerComponent string) might be preferred
      // for lookups via `Components.ComponentName`.
      // However, `getExportedDeclarations` gives us the actual exported identifiers.
      if (!componentLocationCache!.has(exportedName) || !componentLocationCache!.get(exportedName)!.isDefault) {
        componentLocationCache!.set(exportedName, {
          path: filePath,
          exportName: exportedName,
          isDefault: false,
        });
      }
    });

    // 2. Handle `export default registerComponent('ComponentName', ...)`
    const defaultExportNode = sourceFile.getDescendantsOfKind(SyntaxKind.ExportAssignment)
      .find(ea => ea.isExportEquals() === false); // Finds `export default ...`

    if (defaultExportNode) {
      const expression = defaultExportNode.getExpression();
      if (Node.isCallExpression(expression) && Node.isIdentifier(expression.getExpression()) && expression.getExpression().getText() === 'registerComponent') {
        const args = expression.getArguments();
        if (args.length > 0 && Node.isStringLiteral(args[0])) {
          const registeredName = args[0].getLiteralText();
          // This registeredName is key for `Components.registeredName` lookups.
          // It should point to a default import.
          componentLocationCache!.set(registeredName, {
            path: filePath,
            exportName: registeredName, // We'll import the default export and name it this.
            isDefault: true,
          });
        }
      }
    }
  }
  console.log(`Worker: Component cache initialized with ${componentLocationCache!.size} components by scanning.`);

  // Save the newly built cache to the file system
  if (componentLocationCache && componentLocationCache.size > 0) {
    try {
      console.log(`Worker: Saving component cache to ${cacheFilePath}`);
      const serializedCache = JSON.stringify(Array.from(componentLocationCache.entries()), null, 2);
      fs.writeFileSync(cacheFilePath, serializedCache, 'utf-8');
      console.log(`Worker: Component cache saved successfully to ${cacheFilePath}.`);
    } catch (error) {
      console.error(`Worker: Failed to save component cache to ${cacheFilePath}. Error:`, error);
    }
  }
  // For debugging cache content:
  // componentLocationCache.forEach((v, k) => console.log(`CACHE (built): ${k} -> ${JSON.stringify(v)}`));
}

async function processFile(project: Project, filePath: string): Promise<{ status: 'modified' | 'error' | 'no_changes_needed' | 'not_applicable', error?: string }> {
  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) {
    return { status: 'error', error: `File not found in project: ${filePath}` };
  }
  if (!componentLocationCache) {
    return { status: 'error', error: 'Component cache not initialized!' };
  }

  let modified = false;
  // modulePath -> { defaultImport?: string, namedImports: Map<actualExportName, aliasName | undefined> }
  const componentsToImport = new Map<string, { defaultImport?: string; namedImports: Map<string, string | undefined> }>();

  const vulcanLibImportPathSuffix = 'lib/vulcan-lib/components';
  let componentsImportDeclaration: ImportDeclaration | undefined;
  let componentsIdentifierName: string | undefined;

  sourceFile.getImportDeclarations().forEach(importDecl => {
    if (importDecl.getModuleSpecifierValue().endsWith(vulcanLibImportPathSuffix)) {
      const componentsImport = importDecl.getNamedImports().find(ni => ni.getNameNode().getText() === 'Components');
      if (componentsImport) {
        componentsImportDeclaration = importDecl;
        componentsIdentifierName = componentsImport.getAliasNode()?.getText() || componentsImport.getNameNode().getText();
      }
    }
  });

  if (!componentsIdentifierName) {
    // If 'Components' from the target lib is not imported, assume no changes for this specific transform.
    // A more advanced version could check for a global 'Components' or 'Components' from other sources.
    const text = sourceFile.getFullText();
    if (text.includes("Components.") || text.match(/=\s*Components\b/)) {
      // console.log(`Worker: ${filePath} uses 'Components' but not via the expected import from '${vulcanLibImportPathSuffix}'. Skipping this file for this transform.`);
    }
    return { status: 'no_changes_needed' };
  }

  // 1. Handle `Components.ComponentName` (Property Access)
  const propertyAccesses = sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression);
  for (const pae of propertyAccesses) {
    if (pae.getExpression().getText() === componentsIdentifierName) {
      const componentName = pae.getName(); // This is the name used in `Components.X`
      const cacheEntry = componentLocationCache!.get(componentName);

      if (cacheEntry) {
        const componentDiskPath = cacheEntry.path;
        if (!componentsToImport.has(componentDiskPath)) {
          componentsToImport.set(componentDiskPath, { namedImports: new Map() });
        }
        const importInfo = componentsToImport.get(componentDiskPath)!;

        if (cacheEntry.isDefault) {
          importInfo.defaultImport = cacheEntry.exportName; // Use the name from registerComponent string
        } else {
          // If componentName (used in Components.X) is different from actual cacheEntry.exportName, it's an implicit alias
          if (componentName !== cacheEntry.exportName) {
            importInfo.namedImports.set(cacheEntry.exportName, componentName); // import { exportName as componentName }
          } else {
            importInfo.namedImports.set(cacheEntry.exportName, undefined); // import { exportName }
          }
        }
        pae.replaceWithText(componentName); // Replace Components.X with X
        modified = true;
      } else {
        console.warn(`Worker: [WARN] Could not find location for component '${componentName}' accessed via '${componentsIdentifierName}.${componentName}' in ${filePath}. It will not be replaced.`);
      }
    }
  }

  // 2. Handle Destructuring: `const { C1, C2 } = Components;`
  const varStatements = sourceFile.getVariableStatements();
  for (const varStmt of varStatements) {
    for (const decl of varStmt.getDeclarations()) {
      const initializer = decl.getInitializer();
      if (initializer && Node.isIdentifier(initializer) && initializer.getText() === componentsIdentifierName) {
        const nameNode = decl.getNameNode();
        if (Node.isObjectBindingPattern(nameNode)) {
          const elementsInvolvedInReplacement: BindingElement[] = [];

          for (const element of nameNode.getElements()) {
            const propertyNameNode = element.getPropertyNameNode(); // What's accessed on Components (e.g. RealName in { RealName: Alias })
            const localNameNode = element.getNameNode(); // The local variable (e.g. Alias in { RealName: Alias } or C1 in { C1 })

            if (!Node.isIdentifier(localNameNode)) {
              console.warn(`Worker: [WARN] Skipping complex binding element (non-identifier name part): ${element.getText()} in ${filePath}`);
              continue;
            }

            const nameUsedForCacheLookup = propertyNameNode ? propertyNameNode.getText() : localNameNode.getText();
            const localVariableName = localNameNode.getText();
            const cacheEntry = componentLocationCache!.get(nameUsedForCacheLookup);

            if (cacheEntry) {
              elementsInvolvedInReplacement.push(element);
              const componentDiskPath = cacheEntry.path;
              if (!componentsToImport.has(componentDiskPath)) {
                componentsToImport.set(componentDiskPath, { namedImports: new Map() });
              }
              const importInfo = componentsToImport.get(componentDiskPath)!;

              if (cacheEntry.isDefault) {
                importInfo.defaultImport = cacheEntry.exportName; // Name it as per registerComponent string
                // If aliased: const { Alias: DefaultRegisteredName } = Components
                // localVariableName = Alias, cacheEntry.exportName = DefaultRegisteredName
                // We import `DefaultRegisteredName`, and usages of `Alias` must become `DefaultRegisteredName`
                if (localVariableName !== cacheEntry.exportName) {
                   console.log(`Worker: Aliasing default import in destructuring: ${cacheEntry.exportName} as ${localVariableName} in ${filePath}. Renaming usages.`);
                   localNameNode.findReferencesAsNodes().forEach((refNode: Node) => {
                     if (Node.isIdentifier(refNode)) refNode.replaceWithText(cacheEntry.exportName);
                   });
                }
              } else { // Named import
                // cacheEntry.exportName is the actual exported name
                // localVariableName is the name it should have locally
                if (localVariableName !== cacheEntry.exportName) {
                  importInfo.namedImports.set(cacheEntry.exportName, localVariableName); // import { exportName as localVariableName }
                } else {
                  importInfo.namedImports.set(cacheEntry.exportName, undefined); // import { exportName }
                }
                 // If original destructuring used aliasing: { RealExportName: Alias } = Components;
                 // propertyNameNode.getText() = RealExportName (==cacheEntry.exportName)
                 // localNameNode.getText() = Alias (==localVariableName)
                 // No renaming of usages needed here as the import alias handles it.
              }
            } else {
              console.warn(`Worker: [WARN] Could not find location for destructured component '${nameUsedForCacheLookup}' from ${componentsIdentifierName} in ${filePath}. Destructuring element kept.`);
            }
          }
          // Now, handle removal or modification based on elementsInvolvedInReplacement
          if (elementsInvolvedInReplacement.length > 0) {
            modified = true; // A change will occur (either removal or modification of destructuring)

            const totalElementsInPattern = nameNode.getElements().length;

            if (elementsInvolvedInReplacement.length === totalElementsInPattern) {
              // All elements in this destructuring pattern are being replaced by direct imports.
              // Remove the entire variable declaration.
              decl.remove();
              if (varStmt.getDeclarations().length === 0) {
                varStmt.remove(); // Also remove the 'const/let/var' statement if it becomes empty.
              }
            } else {
              // Some elements were processed (are in elementsInvolvedInReplacement),
              // others (not in elementsInvolvedInReplacement) should remain in the destructuring.
              const elementsToKeep = nameNode.getElements().filter(
                element => !elementsInvolvedInReplacement.includes(element)
              );

              if (elementsToKeep.length > 0) {
                // Reconstruct the ObjectBindingPattern with only the elements to keep.
                const newBindingPatternText = `{ ${elementsToKeep.map(el => el.getText()).join(", ")} }`;
                nameNode.replaceWithText(newBindingPatternText);
              } else {
                // This case means elementsToKeep is empty. This implies that all original elements
                // were indeed in elementsInvolvedInReplacement, which should have been caught by the
                // (elementsInvolvedInReplacement.length === totalElementsInPattern) condition.
                // This acts as a safeguard: if nothing is to be kept, remove the declaration.
                console.warn(`Worker: [INFO] Destructuring pattern for ${decl.getName()} in ${filePath} became empty after processing. Removing declaration.`);
                decl.remove();
                if (varStmt.getDeclarations().length === 0) {
                  varStmt.remove();
                }
              }
            }
          }
          // If elementsInvolvedInReplacement.length === 0, no changes needed for this destructuring declaration.
        }
      }
    }
  }

  // 3. Add new import declarations
  if (componentsToImport.size > 0) {
    for (const [componentDiskPath, importDetails] of componentsToImport) {
      const relativeImportPath = getRelativePath(sourceFile.getFilePath(), componentDiskPath);
      let existingImportDecl: ImportDeclaration | undefined = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === relativeImportPath);

      if (existingImportDecl) { // Modify existing import
        if (importDetails.defaultImport && !existingImportDecl.getDefaultImport()) {
          existingImportDecl.setDefaultImport(importDetails.defaultImport);
        }
        const existingNamedImports = existingImportDecl.getNamedImports().map(ni => ({
          name: ni.getNameNode().getText(),
          alias: ni.getAliasNode()?.getText()
        }));

        const namedImportsToAdd: { name: string; alias?: string }[] = [];
        importDetails.namedImports.forEach((alias, name) => {
          const alreadyPresent = existingNamedImports.some(eni =>
            eni.name === name && eni.alias === alias
          );
          if (!alreadyPresent) {
            namedImportsToAdd.push({ name, alias });
          }
        });
        if (namedImportsToAdd.length > 0) existingImportDecl.addNamedImports(namedImportsToAdd);

      } else { // Add new import declaration
        const namedImportStructs = Array.from(importDetails.namedImports.entries())
          .map(([name, alias]) => ({ name, alias }));

        if (importDetails.defaultImport || namedImportStructs.length > 0) {
          sourceFile.addImportDeclaration({
            moduleSpecifier: relativeImportPath,
            defaultImport: importDetails.defaultImport,
            namedImports: namedImportStructs.length > 0 ? namedImportStructs : undefined,
          });
        }
      }
    }
    modified = true; // Ensure modified is true if imports were added/changed
  }

  if (modified) { // Only organize if there's a reason to
    sourceFile.organizeImports();
  }


  // 4. Clean up `Components` import from `vulcan-lib/components`
  if (componentsImportDeclaration && componentsIdentifierName && modified) { // Only try to remove if we made changes
    let isStillUsed = false;
    sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).forEach(id => {
      if (id.getText() === componentsIdentifierName) {
        const parent = id.getParent();
        if ((Node.isPropertyAccessExpression(parent) && parent.getExpression() === id) ||
          (Node.isVariableDeclaration(parent) && parent.getInitializer() === id)) {
          // Check if this usage was one we were supposed to handle but couldn't (e.g. component not in cache)
          if (Node.isPropertyAccessExpression(parent) && parent.getExpression() === id) {
            if (!componentLocationCache!.has(parent.getName())) isStillUsed = true;
          } else { // For other direct usages like `const x = Components` or unhandled destructuring
            isStillUsed = true;
          }
        }
      }
    });

    if (!isStillUsed) {
      const componentsSpecifier = componentsImportDeclaration.getNamedImports()
        .find(ni => (ni.getAliasNode()?.getText() || ni.getNameNode().getText()) === componentsIdentifierName);
      if (componentsSpecifier) {
        componentsSpecifier.remove();
        if (componentsImportDeclaration.getNamedImports().length === 0 &&
          !componentsImportDeclaration.getDefaultImport() &&
          !componentsImportDeclaration.getNamespaceImport()) {
          componentsImportDeclaration.remove();
        }
        sourceFile.organizeImports();
      }
    }
  }

  if (modified) {
    await sourceFile.save();
    return { status: 'modified' };
  } else {
    return { status: 'no_changes_needed' };
  }
}

// Define the function that will process a batch of files
async function processComponentsBatch(batchFilePaths: string[]): Promise<Array<{ filePath: string, status: 'modified' | 'error' | 'no_changes_needed' | 'not_applicable', error?: string }>> {
  // Access tsConfigFilePath and allSourceFilePaths from workerData
  // Type assertion for workerData structure
  const { tsConfigFilePath, allSourceFilePaths } = currentWorkerData as {
    filePaths: string[]; // current batchFilePaths, also passed as arg
    tsConfigFilePath: string;
    allSourceFilePaths: string[];
  };

  if (!tsConfigFilePath || !allSourceFilePaths) {
    // This case should ideally be caught by tsMorphWorker.ts if workerData is incomplete,
    // but as a safeguard:
    console.error('Worker: processComponentsBatch started with incomplete workerData.');
    return batchFilePaths.map(fp => ({
      filePath: fp,
      status: 'error',
      error: 'Worker received incomplete workerData (missing tsConfigFilePath or allSourceFilePaths)'
    }));
  }

  const project = new Project({ tsConfigFilePath });
  // Add ALL source files to the project for comprehensive cache building and analysis
  project.addSourceFilesAtPaths(allSourceFilePaths);

  // Initialize the component cache (if not already initialized in this worker instance)
  // The cache is a module-level global, shared if this function were called multiple times
  // by the same worker (though with current manager, one worker = one batch).
  await initializeComponentCacheIfNeeded(project);

  if (!componentLocationCache) { // Should have been initialized by now
    console.error("Worker: Component cache failed to initialize.");
    return batchFilePaths.map(fp => ({
      filePath: fp,
      status: 'error',
      error: 'Component cache failed to initialize'
    }));
  }

  const results = [];
  for (const filePath of batchFilePaths) {
    try {
      // Ensure the specific file from the batch is loaded if not already by the glob/allSourceFilePaths
      // (it should be, as batchFilePaths should be a subset of allSourceFilePaths)
      if (!project.getSourceFile(filePath)) {
        project.addSourceFileAtPath(filePath); // Should be rare if allSourceFilePaths is comprehensive
      }
      const result = await processFile(project, filePath); // processFile returns {status, error?}
      results.push({ filePath, ...result });
    } catch (e: any) {
      console.error(`Worker: Error processing file ${filePath} in processComponentsBatch:`, e);
      results.push({ filePath, status: 'error' as const, error: e.message || String(e) });
    }
  }
  return results;
}

// Start the worker using the utility from tsMorphWorker.ts
void startWorkerForBatch(processComponentsBatch);
