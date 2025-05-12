/* eslint-disable */
import path from "path";
import { Project, Node, SyntaxKind, VariableDeclaration, FunctionDeclaration, Identifier, IndentationText, QuoteKind, SourceFile, VariableStatement, ImportDeclaration } from "ts-morph";
import { JsxEmit } from "typescript";
import { startWorkerForBatch } from "./tsMorphWorker";

interface MyWorkerData {
  filePaths: string[]; // The batch for this worker
  allSourceFilePaths: string[];
  tsConfigFilePath?: string;
}

interface ConvertedComponentInfo {
  originalExportName: string;
  filePath: string;
}

interface RefactorSourceFileResult {
  filePath: string;
  status: 'modified' | 'no_changes_needed' | 'error';
  error?: string;
  convertedComponents: ConvertedComponentInfo[];
}

async function refactorSourceFile(sourceFile: SourceFile, parentPort: typeof import('worker_threads').parentPort): Promise<RefactorSourceFileResult> {
  if (!parentPort) {
    throw new Error('This script should be run via worker_threads');
  }

  const filePath = sourceFile.getFilePath();
  let madeChanges = false;
  const convertedComponents: ConvertedComponentInfo[] = [];

  parentPort.postMessage({ message: `Refactoring source file: ${filePath}`, status: 'info' });

  try {
    const registerComponentCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const callExpr of registerComponentCalls) {
      if (callExpr.wasForgotten()) {
        // Conditional log for specific files of interest if this path is hit
        // if (filePath.includes("CommentsNode") || filePath.includes("AdminHome")) {
          parentPort.postMessage({ message: `[DEBUG] Skipping a CallExpression in ${filePath} as it was forgotten (node details unavailable).`, status: 'info' });
        // }
        continue;
      }
      const expression = callExpr.getExpression();

      if (Node.isIdentifier(expression) && expression.getText() === "registerComponent") {
        const args = callExpr.getArguments();

        // Attempt to get varStatement and originalExportName BEFORE any AST modifications
        let originalExportNameIfDefaulted: string | undefined;
        let varStatementToModify: VariableStatement | undefined;
        const parentVarDeclInitial = callExpr.getParentIfKind(SyntaxKind.VariableDeclaration);

        if (parentVarDeclInitial) {
          originalExportNameIfDefaulted = parentVarDeclInitial.getName();
          const varDeclList = parentVarDeclInitial.getParentIfKind(SyntaxKind.VariableDeclarationList);
          if (varDeclList) {
            varStatementToModify = varDeclList.getParentIfKind(SyntaxKind.VariableStatement);
          }
        }

        // 1. Component Rename Logic (e.g., XxxInner to Xxx)
        if (args.length >= 2 && Node.isIdentifier(args[1])) {
          const componentIdentifierArg = args[1] as Identifier;
          const componentSymbol = componentIdentifierArg.getSymbol();
          if (componentSymbol) {
            const declarations = componentSymbol.getDeclarations();
            if (declarations && declarations.length > 0) {
              const componentDeclaration = declarations[0];
              if (Node.isVariableDeclaration(componentDeclaration) || Node.isFunctionDeclaration(componentDeclaration)) {
                const declarationNameNode = (componentDeclaration as VariableDeclaration | FunctionDeclaration).getNameNode();
                if (declarationNameNode) {
                  const currentDeclarationName = declarationNameNode.getText();
                  if (currentDeclarationName.endsWith("Inner")) {
                    const newComponentName = currentDeclarationName.slice(0, -5);
                    // if (filePath.includes("AdminHome")) {
                      parentPort.postMessage({ message: `Renaming component declaration ${currentDeclarationName} to ${newComponentName}`, status: 'info' });
                    // }
                    (componentDeclaration as VariableDeclaration | FunctionDeclaration).rename(newComponentName);
                    madeChanges = true;
                  }
                }
              }
            }
          }
        }
        // End of Component Rename Logic

        // 2. Export Modification Logic (to export default)
        // This uses varStatementToModify and originalExportNameIfDefaulted captured BEFORE the rename
        if (varStatementToModify && originalExportNameIfDefaulted && !varStatementToModify.wasForgotten()) {
          // Get the text of callExpr AFTER the potential rename, as componentIdentifierArg inside it would have been updated.
          const registerCallText = callExpr.getText(); 
          const componentNameForLog = args[0]?.isKind(SyntaxKind.StringLiteral) ? args[0].getLiteralText() : originalExportNameIfDefaulted;
          
          if (filePath.includes("AdminHome")) {
            parentPort.postMessage({ message: `Changing assignment of '${originalExportNameIfDefaulted}' to 'export default ${registerCallText}' for component '${componentNameForLog}' in ${filePath}`, status: 'info' });
          }
          varStatementToModify.replaceWithText(`export default ${registerCallText};`);
          madeChanges = true;
          convertedComponents.push({ originalExportName: originalExportNameIfDefaulted, filePath: filePath });
        } else if (parentVarDeclInitial && (!varStatementToModify || !originalExportNameIfDefaulted)) {
          // Log if we had a var decl but couldn't find its statement for modification (should be rare)
          // console.warn(`Could not find VariableStatement for component export related to ${parentVarDeclInitial.getName()} in ${filePath}. Cannot convert to default export.`);
        }
        // End of Export Modification Logic
      }
    } // End for...of registerComponentCalls
  } catch (e: any) {
    // if (filePath.includes("AdminHome")) {
      parentPort.postMessage({ message: `Error during refactorSourceFile for ${filePath}: ${e.message}`, status: 'error' });
    // }
    return {
      filePath: filePath,
      status: 'error' as const,
      error: `Critical error in refactorSourceFile: ${e.message || String(e)}`,
      convertedComponents: [],
    };
  }

  return {
    filePath: filePath,
    status: madeChanges ? 'modified' : 'no_changes_needed',
    convertedComponents,
  };
}

async function updateImporters(
  project: Project,
  originalExportName: string,
  componentFilePath: string,
  parentPort: typeof import('worker_threads').parentPort
): Promise<string[]> {
  if (!parentPort) {
    throw new Error('This script should be run via worker_threads');
  }

  const modifiedImporterPaths: string[] = [];
  const componentFile = project.getSourceFileOrThrow(componentFilePath); // Should exist
  // if (componentFilePath.includes("AdminHome")) {
    parentPort.postMessage({ message: `[UpdateImporters] Called for component: ${originalExportName}`, status: 'info' });
  // }

  for (const importerSourceFile of project.getSourceFiles()) {
    if (importerSourceFile.getFilePath() === componentFilePath) continue;
    // console.log(`[UpdateImporters] Checking importer: ${importerSourceFile.getFilePath()} for imports of ${originalExportName}`);

    let importerFileWasModified = false;
    for (const importDecl of importerSourceFile.getImportDeclarations()) {
      const moduleSpecifierText = importDecl.getModuleSpecifierValue();
      const referencedSourceFile = importDecl.getModuleSpecifierSourceFile();
      // console.log(`[UpdateImporters]   Importer: ${importerSourceFile.getFilePath()}, ImportDecl: '${moduleSpecifierText}'`);

      if (referencedSourceFile) {
        // console.log(`[UpdateImporters]     Resolved import '${moduleSpecifierText}' to: ${referencedSourceFile.getFilePath()}`);
        if (referencedSourceFile.getFilePath() === componentFile.getFilePath()) {
          if (importerSourceFile.getFilePath().includes("AdminHome")) {
            parentPort.postMessage({ message: `[UpdateImporters]     MATCH! Importer: ${importerSourceFile.getFilePath()} imports from ${componentFile.getFilePath()} (looking for '${originalExportName}')`, status: 'info' });
          }
          const namedImports = importDecl.getNamedImports();
          let importSpecifierFoundAndRemoved = false;
          let newDefaultImportName = originalExportName;

          // console.log(`[UpdateImporters]       Found ${namedImports.length} named imports: ${namedImports.map(ni => ni.getNameNode().getText() + (ni.getAliasNode() ? ' as ' + ni.getAliasNode()!.getText() : '')).join(', ')}`);

          for (const namedImport of namedImports) {
            // console.log(`[UpdateImporters]         Checking named import: ${namedImport.getNameNode().getText()}`);
            if (namedImport.getNameNode().getText() === originalExportName) {
              if (importerSourceFile.getFilePath().includes("AdminHome")) {
                parentPort.postMessage({ message: `[UpdateImporters]           Found named import specifier: ${namedImport.getText()} in ${importerSourceFile.getFilePath()}`, status: 'info' });
              }
              const aliasNode = namedImport.getAliasNode();
              if (aliasNode) {
                newDefaultImportName = aliasNode.getText();
                if (importerSourceFile.getFilePath().includes("AdminHome")) {
                  parentPort.postMessage({ message: `[UpdateImporters]             Alias found: ${newDefaultImportName}`, status: 'info' });
                }
              }
              namedImport.remove();
              importSpecifierFoundAndRemoved = true;
              importerFileWasModified = true;
              if (importerSourceFile.getFilePath().includes("AdminHome")) {
                parentPort.postMessage({ message: `[UpdateImporters]             Removed named import '${originalExportName}'. New default will be '${newDefaultImportName}'.`, status: 'info' });
              }
              break;
            }
          }

          if (importSpecifierFoundAndRemoved) {
            const existingDefaultImport = importDecl.getDefaultImport();
            if (existingDefaultImport) {
              if (existingDefaultImport.getText() !== newDefaultImportName) {
                // console.warn(`WARN: Importer ${importerSourceFile.getFilePath()} already has default import '${existingDefaultImport.getText()}' from ${componentFilePath}. Overwriting with '${newDefaultImportName}'. Review usages.`);
                existingDefaultImport.rename(newDefaultImportName);
              }
            } else {
              importDecl.setDefaultImport(newDefaultImportName);
            }

            // If we removed the only named import and a default import now exists, clean up the empty braces.
            if (importDecl.getNamedImports().length === 0 && importDecl.getDefaultImport()) {
              importDecl.removeNamedImports(); // This should remove the empty braces {}
            } else if (importDecl.getNamedImports().length === 0 && !importDecl.getDefaultImport() && !importDecl.getNamespaceImport()) {
              // This handles if the import becomes COMPLETELY empty (no default, no named, no namespace)
              // console.log(`Removing now-empty import declaration from ${importerSourceFile.getFilePath()} for module ${componentFilePath}`);
              importDecl.remove();
            }
            // User-commented log:
            // console.log(`Updated import in ${importerSourceFile.getFilePath()}: '${originalExportName}' from ${componentFilePath} to default import '${newDefaultImportName}'.`);
          }
        }
      }
    }
    if (importerFileWasModified) {
      modifiedImporterPaths.push(importerSourceFile.getFilePath());
    }
  }
  return modifiedImporterPaths;
}


async function batchUpdateImporters(
  project: Project,
  convertedComponents: ConvertedComponentInfo[],
  parentPort: typeof import('worker_threads').parentPort,
): Promise<string[]> {
  if (!parentPort) {
    throw new Error('This script should be run via worker_threads');
  }

  const modifiedImporterPaths: string[] = [];

  // Quick look-ups
  const compPathToExportName = new Map<string, string>();
  const componentPaths = new Set<string>();
  for (const comp of convertedComponents) {
    const absPath = project.getSourceFileOrThrow(comp.filePath).getFilePath();
    compPathToExportName.set(absPath, comp.originalExportName);
    componentPaths.add(absPath);
  }

  // Visit every source file exactly once
  for (const importerSourceFile of project.getSourceFiles()) {
    // if (componentPaths.has(importerSourceFile.getFilePath())) continue; // skip components themselves

    parentPort.postMessage({ message: `[UpdateImporters] Visiting importer: ${importerSourceFile.getFilePath()}`, status: 'info' });

    let importerFileWasModified = false;

    const importDecls = importerSourceFile.getImportDeclarations();

    for (const importDecl of importDecls) {
      const referencedSourceFile = importDecl.getModuleSpecifierSourceFile();
      if (!referencedSourceFile) continue;

      const refPath = referencedSourceFile?.getFilePath();
      const originalExportName = compPathToExportName.get(refPath);
      if (!originalExportName) continue; // import not affected

      // ── Fix up the declaration ────────────────────────────────
      for (const namedImport of [...importDecl.getNamedImports()]) {
        if (namedImport.getNameNode().getText() !== originalExportName) continue;

        const aliasNode = namedImport.getAliasNode();
        const newDefaultImportName = aliasNode ? aliasNode.getText() : originalExportName;

        namedImport.remove();
        importerFileWasModified = true;

        const existingDefault = importDecl.getDefaultImport();
        if (existingDefault) {
          if (existingDefault.getText() !== newDefaultImportName) existingDefault.rename(newDefaultImportName);
        } else {
          importDecl.setDefaultImport(newDefaultImportName);
        }
      }

      // Clean up: drop { } or whole import if empty
      if (!importDecl.wasForgotten()) {
        if (importDecl.getNamedImports().length === 0) {
          if (importDecl.getDefaultImport()) {
            importDecl.removeNamedImports();
          // } else if (!importDecl.getNamespaceImport()) {
          //   importDecl.remove();
          }
        }
      }
    }

    if (importerFileWasModified) {
      modifiedImporterPaths.push(importerSourceFile.getFilePath());
    }
  }

  return modifiedImporterPaths;
}


async function refactorComponentRegistrations(
  filePathsInBatch: string[],
  parentPort: typeof import('worker_threads').parentPort,
  workerData: MyWorkerData
): Promise<Array<{ filePath: string, status: 'modified' | 'no_changes_needed' | 'error', error?: string }>> {
  parentPort?.postMessage({ message: `${new Date().toISOString()} Entered refactorComponentRegistrations.`, status: 'info' });

  if (!parentPort) {
    throw new Error('This script should be run via worker_threads');
  }

  try {
    if (!workerData || !workerData.allSourceFilePaths) {
      parentPort.postMessage({ message: "Worker: Missing allSourceFilePaths in workerData. Cannot update importers.", status: 'error' });
      return filePathsInBatch.map(fp => ({
        filePath: fp,
        status: 'error' as const,
        error: 'Worker missing allSourceFilePaths in workerData',
      }));
    }
  
    parentPort.postMessage({ message: `${new Date().toISOString()} Handling batch of ${filePathsInBatch.length} files with ${workerData.allSourceFilePaths.length} total files in project.`, status: 'info' });
  
    const project = new Project({
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces,
        quoteKind: QuoteKind.Single,
      },
      compilerOptions: {
        jsx: JsxEmit.ReactJSX,
        allowJs: true,
        target: 99, // ESNext
        module: 99, // ESNext
        esModuleInterop: true,
      },
      tsConfigFilePath: workerData.tsConfigFilePath,
    });
  
    parentPort.postMessage({ message: `${new Date().toISOString()} Created project.`, status: 'info' });
  
    project.addSourceFilesAtPaths(workerData.allSourceFilePaths);
  
    parentPort.postMessage({ message: `${new Date().toISOString()} Added source files to project, starting refactoring.`, status: 'info' });
  
    const resultsFromRefactorSourceFile: RefactorSourceFileResult[] = [];
    const resultPromises = [];
    for (const filePath of filePathsInBatch) {
      const sourceFile = project.getSourceFile(filePath);
      if (sourceFile) {
        resultPromises.push(refactorSourceFile(sourceFile, parentPort));
      } else {
        resultsFromRefactorSourceFile.push({
          filePath,
          status: 'error' as const,
          error: `File from batch not found in project: ${filePath}`,
          convertedComponents: [],
        });
      }
    }
  
    resultsFromRefactorSourceFile.push(...await Promise.all(resultPromises));
  
    const allConvertedComponentsThisBatch: ConvertedComponentInfo[] = [];
    resultsFromRefactorSourceFile.forEach(res => {
      if (res.status === 'modified' && res.convertedComponents) {
        allConvertedComponentsThisBatch.push(...res.convertedComponents);
      }
    });
  
    const allModifiedFilePathsInWorker = new Set<string>();
    resultsFromRefactorSourceFile.forEach(r => {
      if (r.status === 'modified') allModifiedFilePathsInWorker.add(r.filePath);
    });

    await project.save();
  
    if (allConvertedComponentsThisBatch.length > 0) {
      parentPort.postMessage({ message: `Worker: ${allConvertedComponentsThisBatch.length} components changed to default export. Updating importers across ${project.getSourceFiles().length} files...`, status: 'info' });
      // for (const convComp of allConvertedComponentsThisBatch) {
      //   const modifiedImporters = await updateImporters(project, convComp.originalExportName, convComp.filePath, parentPort);
      //   modifiedImporters.forEach(p => allModifiedFilePathsInWorker.add(p));
      // }

      const modifiedImporters = await batchUpdateImporters(project, allConvertedComponentsThisBatch, parentPort);
      modifiedImporters.forEach(p => allModifiedFilePathsInWorker.add(p));
    }
  
    if (allModifiedFilePathsInWorker.size > 0) {
      parentPort.postMessage({ message: `Worker: Saving ${allModifiedFilePathsInWorker.size} modified files...`, status: 'info' });
      await project.save();
      parentPort.postMessage({ message: "Worker: Save complete.", status: 'info' });
    } else {
      parentPort.postMessage({ message: "Worker: No files were modified in this batch (including importers). Skipping save.", status: 'info' });
    }
    
    const finalBatchResults: Array<{ filePath: string, status: 'modified' | 'no_changes_needed' | 'error', error?: string }> = [];
    for (const filePath of filePathsInBatch) {
      const originalResult = resultsFromRefactorSourceFile.find(r => r.filePath === filePath);
      let status: 'modified' | 'no_changes_needed' | 'error' = 'no_changes_needed';
      let error: string | undefined;
  
      if (originalResult) {
          status = originalResult.status;
          error = originalResult.error;
      }
      if (allModifiedFilePathsInWorker.has(filePath)) {
          status = 'modified';
      }
  
      finalBatchResults.push({
        filePath,
        status,
        error,
      });
    }
    
    return finalBatchResults;
  } catch (e: any) {
    parentPort.postMessage({ message: `${new Date().toISOString()} CRITICAL ERROR at the start of refactorComponentRegistrations: ${e.message}`, status: 'error' });
    // Return error for all files in this batch
    return filePathsInBatch.map(fp => ({
      filePath: fp,
      status: 'error' as const,
      error: `Critical early error in worker: ${e.message || String(e)}`,
    }));
  }
}

startWorkerForBatch(refactorComponentRegistrations);