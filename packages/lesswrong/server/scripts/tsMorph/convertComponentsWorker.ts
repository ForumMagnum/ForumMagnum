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
} from 'ts-morph';
import path from 'path';
import { startWorkerForBatch } from './tsMorphWorker';
import { workerData as currentWorkerData } from 'worker_threads';

// Cache for component locations (ComponentName -> filePath)
let componentLocationCache: Map<string, string> | null = null;

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

  console.log(`Worker: Initializing component cache by scanning source files.`);
  componentLocationCache = new Map<string, string>();
  const sourceFiles = projectForCache.getSourceFiles();

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    sourceFile.getExportedDeclarations().forEach((declarations, name) => {
      // `name` is the exported name (e.g., "MyComponent")
      if (!componentLocationCache!.has(name)) {
        componentLocationCache!.set(name, filePath);
      }
      // Special handling for `registerComponent` to also cache by its first string argument if different.
      // This helps if `Components.RegisteredName` is used and `RegisteredName` was the first arg
      // to `registerComponent` for an export `export const ActualExportName = registerComponent('RegisteredName', ...)`
      // The primary goal is to import `ActualExportName`.
      // For this codemod, we'll assume the name used with `Components.X` is `X` itself, which is also exported.
      // The current caching of `name` (the exported identifier) covers the examples.
    });
  }
  console.log(`Worker: Component cache initialized with ${componentLocationCache!.size} components.`);
  // For debugging cache content:
  // componentLocationCache!.forEach((v, k) => console.log(`CACHE: ${k} -> ${v}`));
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
  const componentsToImport: Map<string, Set<string>> = new Map(); // modulePath -> Set<ComponentName>

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
      const componentName = pae.getName();
      const componentDiskPath = componentLocationCache!.get(componentName);

      if (componentDiskPath) {
        if (!componentsToImport.has(componentDiskPath)) {
          componentsToImport.set(componentDiskPath, new Set());
        }
        componentsToImport.get(componentDiskPath)!.add(componentName);
        pae.replaceWithText(componentName);
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
          // elementsInvolvedInReplacement will store BindingElements from this specific
          // destructuring pattern that were successfully found in the cache and processed.
          const elementsInvolvedInReplacement: BindingElement[] = [];
          // No longer strictly needed for the removal logic if elementsInvolvedInReplacement is built correctly
          // let allDestructuredFoundOrHandled = true; 

          for (const element of nameNode.getElements()) {
            const propertyNameNode = element.getPropertyNameNode();
            const localNameNode = element.getNameNode();

            if (!Node.isIdentifier(localNameNode)) {
              console.warn(`Worker: [WARN] Skipping complex binding element (non-identifier name part): ${element.getText()} in ${filePath}`);
              // allDestructuredFoundOrHandled = false;
              continue;
            }

            const nameUsedInComponentsObject = propertyNameNode ? propertyNameNode.getText() : localNameNode.getText();
            const localVariableName = localNameNode.getText();

            const componentDiskPath = componentLocationCache!.get(nameUsedInComponentsObject);
            if (componentDiskPath) {
              if (!componentsToImport.has(componentDiskPath)) {
                componentsToImport.set(componentDiskPath, new Set());
              }
              componentsToImport.get(componentDiskPath)!.add(nameUsedInComponentsObject);
              elementsInvolvedInReplacement.push(element); // Add to list of processed elements

              if (localVariableName !== nameUsedInComponentsObject) {
                console.log(`Worker: Aliasing in destructuring: ${nameUsedInComponentsObject} as ${localVariableName} in ${filePath}. Renaming usages.`);
                localNameNode.findReferencesAsNodes().forEach((refNode: Node) => {
                  if (Node.isIdentifier(refNode)) {
                    refNode.replaceWithText(nameUsedInComponentsObject);
                  }
                });
              }
            } else {
              // allDestructuredFoundOrHandled = false;
              console.warn(`Worker: [WARN] Could not find location for destructured component '${nameUsedInComponentsObject}' from ${componentsIdentifierName} in ${filePath}. Destructuring element kept.`);
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
    for (const [componentDiskPath, componentNamesSet] of componentsToImport) {
      let existingImportDecl: ImportDeclaration | undefined = undefined;
      for (const impDecl of sourceFile.getImportDeclarations()) {
        const resolved = impDecl.getModuleSpecifierSourceFile()?.getFilePath();
        if (resolved === componentDiskPath || impDecl.getModuleSpecifierValue() === getRelativePath(sourceFile.getFilePath(), componentDiskPath)) {
          existingImportDecl = impDecl;
          break;
        }
      }

      const importSpecifiersToAdd = Array.from(componentNamesSet).sort();
      if (existingImportDecl) {
        const existingNamedImports = new Set(existingImportDecl.getNamedImports().map(ni => ni.getName()));
        const newSpecifiers = importSpecifiersToAdd.filter(s => !existingNamedImports.has(s));
        if (newSpecifiers.length > 0) {
          existingImportDecl.addNamedImports(newSpecifiers);
        }
      } else {
        sourceFile.addImportDeclaration({
          moduleSpecifier: getRelativePath(sourceFile.getFilePath(), componentDiskPath),
          namedImports: importSpecifiersToAdd,
        });
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
