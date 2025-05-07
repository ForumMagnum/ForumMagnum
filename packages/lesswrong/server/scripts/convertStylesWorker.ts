import { Project, SyntaxKind, CallExpression, Identifier, ObjectLiteralExpression, PropertyAssignment, VariableDeclarationKind, SourceFile, ImportSpecifier, ArrowFunction, FunctionExpression, FunctionDeclaration, Block, VariableStatement, IndentationText, QuoteKind, StringLiteral, ObjectBindingPattern, Node, ShorthandPropertyAssignment, TypeLiteralNode, VariableDeclaration } from 'ts-morph';
import path from 'path';
import ts, { JsxEmit } from 'typescript';

console.log('Worker: Script loaded'); // DEBUG LOG

const HOOKS_USE_STYLES_PATH = '@/components/hooks/useStyles';

// Helper function (addNamedImportIfNeeded) would also be here or imported
function addNamedImportIfNeeded(sourceFile: SourceFile, moduleSpecifier: string, importName: string): boolean {
  let importDeclaration = sourceFile.getImportDeclaration(moduleSpecifier);
  if (!importDeclaration) {
    importDeclaration = sourceFile.addImportDeclaration({ moduleSpecifier });
  }

  const namedImports = importDeclaration.getNamedImports();
  if (!namedImports.some(ni => ni.getName() === importName)) {
    importDeclaration.addNamedImport(importName);
    return true; // Import was added
  }
  return false; // Import already existed
}

// This part allows the worker to receive messages and call processFile
const { parentPort, workerData } = require('worker_threads'); // Ensure workerData is extracted

if (parentPort) { // Ensures it's running as a worker
  if (workerData && workerData.filePaths && Array.isArray(workerData.filePaths)) {
    console.log('Worker: Received initial task via workerData:', workerData); // DEBUG LOG
    processBatchOfFiles(workerData.filePaths, workerData.tsConfigFilePath)
      .then(results => {
        console.log('Worker: Sending batch results back to main', results); // DEBUG LOG
        parentPort.postMessage(results); // Send the batch results
      })
      .catch(error => {
        // This catch is for unexpected errors from processBatchOfFiles itself if it somehow rejects
        // (though processBatchOfFiles is designed to always resolve with an array of results)
        console.error(`Worker: Error during processBatchOfFiles for batch (first file: ${workerData.filePaths.length > 0 ? workerData.filePaths[0] : 'N/A'}):`, error);
        const errorResults = workerData.filePaths.map((fp: string) => ({
          filePath: fp,
          status: 'error',
          error: `Batch processing failed: ${error.message || String(error)}`
        }));
        parentPort.postMessage(errorResults);
      });
  } else {
    console.error('Worker: No filePaths found in workerData or parentPort missing.', { hasParentPort: !!parentPort, hasWorkerData: !!workerData });
    // If it's a worker but no filePaths, it should still signal completion or error to the main thread
    if (parentPort) {
      parentPort.postMessage([{
        filePath: workerData?.filePaths?.[0] || 'unknown_batch',
        status: 'error',
        error: 'Worker started without valid filePaths in workerData'
      }]);
    }
  }
} else {
  // This case should ideally not be reached if the script is only ever run via new Worker()
  console.error('Worker: Not running as a worker thread (parentPort is null). This script should be run via worker_threads.');
}

function findRegisterComponentCalls(sourceFile: SourceFile): CallExpression[] {
  const calls: CallExpression[] = [];
  sourceFile.forEachDescendant(node => {
    if (node.getKind() === SyntaxKind.CallExpression) {
      const callExpression = node as CallExpression;
      const expression = callExpression.getExpression();
      if (expression.getKind() === SyntaxKind.Identifier && expression.getText() === 'registerComponent') {
        // Basic check only, assumes 'registerComponent' is the target function
        calls.push(callExpression);
      }
    }
  });
  return calls;
}

interface RegisterComponentInfo {
  call: CallExpression;
  componentName: string;
  componentIdentifierName: string;
  optionsNode?: ObjectLiteralExpression;
  usesOldStylesPattern: boolean;
  stylesIdentifierName?: string;
  stylePropertyNode?: PropertyAssignment | ShorthandPropertyAssignment;
  stylePriorityValue?: string;
  stylePriorityPropertyNode?: PropertyAssignment;
}

function extractRegisterComponentInfo(call: CallExpression): RegisterComponentInfo | null {
  const args = call.getArguments();
  if (args.length < 2) return null;

  const componentNameNode = args[0];
  const componentIdentifierNode = args[1];
  const optionsNode = args[2];

  const componentName = componentNameNode?.getKind() === SyntaxKind.StringLiteral ?
    (componentNameNode as StringLiteral).getLiteralText() : '[UnknownName]';
  const componentIdentifierName = componentIdentifierNode?.getKind() === SyntaxKind.Identifier ?
    (componentIdentifierNode as Identifier).getText() : '[UnknownIdentifier]';

  let info: Partial<RegisterComponentInfo> = {
    call, componentName, componentIdentifierName, usesOldStylesPattern: false
  };

  if (optionsNode && optionsNode.getKind() === SyntaxKind.ObjectLiteralExpression) {
    info.optionsNode = optionsNode as ObjectLiteralExpression;
    const stylesProperty = info.optionsNode.getProperty('styles');
    if (stylesProperty && (stylesProperty.getKind() === SyntaxKind.PropertyAssignment || stylesProperty.getKind() === SyntaxKind.ShorthandPropertyAssignment)) {
      info.stylePropertyNode = stylesProperty as PropertyAssignment | ShorthandPropertyAssignment;
      if (stylesProperty.getKind() === SyntaxKind.PropertyAssignment) {
        const initializer = (stylesProperty as PropertyAssignment).getInitializer();
        if (initializer) info.stylesIdentifierName = initializer.getText();
      } else { info.stylesIdentifierName = (stylesProperty as ShorthandPropertyAssignment).getName(); }
      info.usesOldStylesPattern = !!info.stylesIdentifierName;
    }

    const priorityProperty = info.optionsNode.getProperty('stylePriority');
    if (priorityProperty && priorityProperty.getKind() === SyntaxKind.PropertyAssignment) {
      info.stylePriorityPropertyNode = priorityProperty as PropertyAssignment;
      const initializer = info.stylePriorityPropertyNode.getInitializer();
      if (initializer) info.stylePriorityValue = initializer.getText();
    }
  }

  // Only return full info if critical parts are present
  if (info.componentName !== '[UnknownName]' && info.componentIdentifierName !== '[UnknownIdentifier]') {
      return info as RegisterComponentInfo;
  }
  return null;
}

function findStyleDefinitionInsertionIndex(sourceFile: SourceFile, componentIdentifierName: string, originalStyleVariable: VariableDeclaration): number | undefined {
  let targetIndex: number | undefined = undefined;
  const componentVarDecl = sourceFile.getVariableDeclaration(componentIdentifierName);
  const componentFuncDecl = sourceFile.getFunction(componentIdentifierName);
  let actualComponentStatementNode: VariableStatement | FunctionDeclaration | undefined;

  if (componentVarDecl) actualComponentStatementNode = componentVarDecl.getFirstAncestorByKind(SyntaxKind.VariableStatement);
  else if (componentFuncDecl && componentFuncDecl.getParentIfKind(SyntaxKind.SourceFile)) actualComponentStatementNode = componentFuncDecl;

  if (actualComponentStatementNode && actualComponentStatementNode.getParentIfKind(SyntaxKind.SourceFile)) {
    targetIndex = actualComponentStatementNode.getChildIndex();
  } else {
    const originalStyleVarStmt = originalStyleVariable.getFirstAncestorByKind(SyntaxKind.VariableStatement);
    if (originalStyleVarStmt && originalStyleVarStmt.getParentIfKind(SyntaxKind.SourceFile)) {
      targetIndex = originalStyleVarStmt.getChildIndex() + 1;
    }
  }
  return targetIndex;
}

function modifyComponentProps(componentFunctionNode: ArrowFunction | FunctionDeclaration): boolean {
  let madeChanges = false;
  for (const param of componentFunctionNode.getParameters()) {
    const paramNameNode = param.getNameNode();
    const paramTypeNode = param.getTypeNode();

    // Case 1: Destructured parameter
    if (paramNameNode?.getKind() === SyntaxKind.ObjectBindingPattern) {
      const objectBindingPattern = paramNameNode as ObjectBindingPattern;
      const elements = objectBindingPattern.getElements();
      const classesBindingElement = elements.find(e => e.getNameNode().getText() === 'classes');
      if (classesBindingElement) {
        const remainingElements = elements.filter(e => e !== classesBindingElement);
        if (remainingElements.length === 0) objectBindingPattern.replaceWithText('{}');
        else objectBindingPattern.replaceWithText(`{ ${remainingElements.map(e => e.getText()).join(', ')} }`);
        madeChanges = true;
      }
    }

    // Case 2: Inline object type
    if (paramTypeNode?.getKind() === SyntaxKind.TypeLiteral) {
      const typeLiteral = paramTypeNode as TypeLiteralNode;
      const classesPropertySignature = typeLiteral.getProperties().find(p => p.getName() === 'classes');
      if (classesPropertySignature) {
        classesPropertySignature.remove();
        madeChanges = true;
      }
    }
  }
  return madeChanges;
}

// Applies transformations for a single registerComponent call
function transformSingleComponentRegistration(info: RegisterComponentInfo, sourceFile: SourceFile): boolean {
  let madeChanges = false;
  const { call, componentName, componentIdentifierName, stylesIdentifierName, stylePriorityValue, stylePropertyNode, stylePriorityPropertyNode } = info;

  if (!info.usesOldStylesPattern || !stylesIdentifierName) {
    return false; // Not the pattern we're targeting
  }

  // Add imports
  if (addNamedImportIfNeeded(sourceFile, HOOKS_USE_STYLES_PATH, 'defineStyles')) madeChanges = true;
  if (addNamedImportIfNeeded(sourceFile, HOOKS_USE_STYLES_PATH, 'useStyles')) madeChanges = true;

  // Find original style variable
  const originalStyleVariable = sourceFile.getVariableDeclaration(stylesIdentifierName);
  if (!originalStyleVariable) {
    console.warn(`Worker: Could not find local variable declaration for style identifier: ${stylesIdentifierName} in ${sourceFile.getFilePath()}. Skipping transformation for ${componentName}.`);
    return false;
  }

  // Create and insert defineStyles definition (if it doesn't exist)
  const newStyleDefVariableName = `${componentIdentifierName.charAt(0).toLowerCase() + componentIdentifierName.slice(1)}StylesDefinition`;
  if (!sourceFile.getVariableDeclaration(newStyleDefVariableName)) {
    const targetIndex = findStyleDefinitionInsertionIndex(sourceFile, componentIdentifierName, originalStyleVariable);

    let defineStylesInitializer = `defineStyles('${componentName}', ${stylesIdentifierName}`;
    if (stylePriorityValue) defineStylesInitializer += `, { stylePriority: ${stylePriorityValue} }`;
    defineStylesInitializer += `)`;

    const declarationToAdd = { declarationKind: VariableDeclarationKind.Const, declarations: [{ name: newStyleDefVariableName, initializer: defineStylesInitializer }] };
    if (targetIndex !== undefined) sourceFile.insertVariableStatement(targetIndex, declarationToAdd);
    else sourceFile.addVariableStatement(declarationToAdd);
    madeChanges = true;

    // Find component function node
    const componentVarDecl = sourceFile.getVariableDeclaration(componentIdentifierName);
    const componentFuncDecl = sourceFile.getFunction(componentIdentifierName);
    let componentFunctionNode: ArrowFunction | FunctionDeclaration | undefined = undefined;
    if (componentVarDecl?.getInitializer()?.getKind() === SyntaxKind.ArrowFunction) componentFunctionNode = componentVarDecl.getInitializer() as ArrowFunction;
    else if (componentFuncDecl) componentFunctionNode = componentFuncDecl;

    // Add useStyles hook
    if (componentFunctionNode) {
      const bodyNode = componentFunctionNode.getBody();
      if (bodyNode && bodyNode.getKind() === SyntaxKind.Block) {
        const bodyBlock = bodyNode as Block;
        if (!bodyBlock.getStatements().some(stmt => stmt.getText().includes(`useStyles(${newStyleDefVariableName})`))) {
          bodyBlock.insertVariableStatement(0, { declarationKind: VariableDeclarationKind.Const, declarations: [{ name: 'classes', initializer: `useStyles(${newStyleDefVariableName})` }] });
          madeChanges = true;
        }
      }
    }

    // Modify component props
    if (componentFunctionNode) {
      if (modifyComponentProps(componentFunctionNode)) {
        madeChanges = true;
      }
    }

    // Update registerComponent call
    if (stylePropertyNode) {
      const optionsObject = stylePropertyNode.getParentIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
      stylePropertyNode.remove();
      if (stylePriorityPropertyNode) stylePriorityPropertyNode.remove();
      madeChanges = true; // Indicates structural change happened
      if (optionsObject.getProperties().length === 0 && call.getArguments().length > 2 && call.getArguments()[2] === optionsObject) {
        call.removeArgument(optionsObject);
      }
    }
  } else {
      // console.log(`Worker: Style definition ${newStyleDefVariableName} already exists in ${sourceFile.getFilePath()}. Skipping related transformations.`);
      // If definition exists, maybe still try to update registerComponent call? For now, skip all if def exists.
      return false; // No changes made in this pass if def already exists
  }

  return madeChanges;
}

// Processes a single source file, orchestrating transformations
function processSingleSourceFile(sourceFile: SourceFile): { status: string, error?: string } {
  const currentFilePath = sourceFile.getFilePath();
  let madeChangesInFile = false;
  let wasEverCandidate = false;

  try {
    const registerComponentCalls = findRegisterComponentCalls(sourceFile);

    if (registerComponentCalls.length > 0) {
      for (const call of registerComponentCalls) {
        wasEverCandidate = true;
        const info = extractRegisterComponentInfo(call);
        if (info) {
            if (transformSingleComponentRegistration(info, sourceFile)) {
                madeChangesInFile = true;
            }
        }
      }
    }

    if (madeChangesInFile) return { status: 'modified' };
    if (wasEverCandidate) return { status: 'no_changes_needed' };
    return { status: 'not_applicable' };

  } catch (e: any) {
    console.error(`Worker: Error processing file ${currentFilePath}:`, e);
    return { status: 'error', error: e.message || String(e) };
  }
}

export async function processBatchOfFiles(filePaths: string[], tsConfigFilePath: string | undefined): Promise<Array<{ filePath: string, status: string, error?: string }>> {
  console.log(`Worker: Starting to process batch of ${filePaths.length} files. First file: ${filePaths.length > 0 ? filePaths[0] : 'N/A'}`);
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
  });

  project.addSourceFilesAtPaths(filePaths);
  const batchResults: Array<{ filePath: string, status: string, error?: string }> = [];
  const inputPathsSet = new Set(filePaths.map(fp => path.resolve(fp)));

  for (const sourceFile of project.getSourceFiles()) {
    const currentFilePath = path.resolve(sourceFile.getFilePath());
    if (!inputPathsSet.has(currentFilePath)) {
      continue; // Skip files not explicitly in the batch
    }

    const result = processSingleSourceFile(sourceFile);
    batchResults.push({ filePath: currentFilePath, ...result });
  } // End loop over sourceFiles in batch

  try {
    await project.save();
  } catch (saveError: any) {
    console.error(`Worker: Error saving files for batch starting with ${filePaths.length > 0 ? filePaths[0] : 'N/A'}:`, saveError);
    // Update results for files in this batch to indicate save failure
    filePaths.forEach(fp => {
      const existingResult = batchResults.find(r => path.resolve(r.filePath) === path.resolve(fp));
      const errorMessage = `Save failed for batch: ${saveError.message || String(saveError)}`;
      if (existingResult) {
        if (existingResult.status !== 'error') existingResult.status = 'error';
        existingResult.error = (existingResult.error ? existingResult.error + "; " : "") + errorMessage;
      } else { // File might not have been processed if error happened early
        batchResults.push({ filePath: fp, status: 'error', error: errorMessage });
      }
    });
  }
  console.log(`Worker: Batch processing finished for batch starting with ${filePaths.length > 0 ? filePaths[0] : 'N/A'}. Results count: ${batchResults.length}`);
  return batchResults;
}
