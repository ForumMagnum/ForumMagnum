/* eslint-disable no-console */

import {
  Project,
  SyntaxKind,
  CallExpression,
  Node,
  VariableDeclarationKind,
  ObjectLiteralExpression,
  PropertyAssignment,
  Identifier,
  BooleanLiteral,
  SourceFile,
  PropertyAccessExpression,
  Expression,
  AsExpression,
  AwaitExpression,
  ShorthandPropertyAssignment,
  Statement,
} from "ts-morph";
import path from "path";
import { pascalCase } from "pascal-case"; // Or use another library for case conversion

// Helper function to ensure a function is async
async function ensureFunctionIsAsync(callExpression: CallExpression): Promise<void> {
  const func = callExpression
    .getAncestors()
    .find(
      (a) =>
        Node.isFunctionDeclaration(a) ||
        Node.isFunctionExpression(a) ||
        Node.isArrowFunction(a) ||
        Node.isMethodDeclaration(a)
    );

  if (func) {
    if (
      Node.isFunctionDeclaration(func) ||
      Node.isFunctionExpression(func) ||
      Node.isArrowFunction(func) ||
      Node.isMethodDeclaration(func)
    ) {
      if (!func.isAsync()) {
        func.setIsAsync(true);
        console.log(`  -> Made ancestor function/method async: ${"getName" in func ? func.getName() : "<anonymous>"}`);
      }
    }
  } else {
    console.warn(`  -> Could not find ancestor function/method to make async for call.`);
  }
}

// Helper function to add imports safely
function addOrUpdateImport(sourceFile: SourceFile, namedImports: string[], moduleSpecifier: string) {
  const existingImport = sourceFile.getImportDeclaration(moduleSpecifier);
  if (existingImport) {
    const existingNamed = existingImport.getNamedImports().map((ni) => ni.getName());
    const importsToAdd = namedImports.filter((ni) => !existingNamed.includes(ni));
    if (importsToAdd.length > 0) {
      existingImport.addNamedImports(importsToAdd);
    }
  } else {
    sourceFile.addImportDeclaration({
      namedImports: namedImports,
      moduleSpecifier: moduleSpecifier,
    });
  }
}

// Helper to get the base name from Identifier or PropertyAccessExpression
function getBaseName(expression: Expression | undefined): string | null {
  if (!expression) return null;
  if (Node.isIdentifier(expression)) {
    return expression.getText();
  }
  if (Node.isPropertyAccessExpression(expression)) {
    return expression.getName(); // Get the last part (e.g., 'LlmMessages' from 'context.LlmMessages')
  }
  return null;
}

// Helper to insert statements before a given statement
function insertStatementBefore(targetStatement: Statement, newStatementText: string) {
  const insertionIndex = targetStatement.getChildIndex();
  const parentContainer = targetStatement.getParent();
  if (parentContainer && typeof (parentContainer as any).insertStatements === "function") {
    (parentContainer as any).insertStatements(insertionIndex, newStatementText);
    return true;
  }
  return false;
}

async function runConversion() {
  const project = new Project({
    tsConfigFilePath: path.resolve(__dirname, "../../../../tsconfig.json"), // Adjust path to your root tsconfig
    skipAddingFilesFromTsConfig: true, // We'll add files manually
  });

  // Add source files
  const sourceFilesDirectory = path.resolve(__dirname, "../"); // Target directory: packages/lesswrong/server
  console.log(`Scanning directory: ${sourceFilesDirectory}`);
  project.addSourceFilesAtPaths([`${sourceFilesDirectory}/**/*.ts`, `${sourceFilesDirectory}/**/*.tsx`]);

  console.log(`Found ${project.getSourceFiles().length} source files.`);

  const allSourceFiles = project.getSourceFiles();
  let changesMade = false;
  let filesChangedCount = 0;

  for (const sourceFile of allSourceFiles) {
    let fileChanged = false;
    const filePath = sourceFile.getFilePath();

    // Track imports needed specifically for *this* file
    const fileImportsToAdd = {
      computeContextFromUser: false,
      createAnonymousContext: false,
      newMutatorFunctions: new Set<string>(), // Renamed for clarity
    };

    // Find both createMutator and updateMutator calls
    const mutatorCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter((callExpr) => {
      const expression = callExpr.getExpression();
      return (
        Node.isIdentifier(expression) &&
        (expression.getText() === "createMutator" || expression.getText() === "updateMutator")
      );
    });

    if (mutatorCalls.length === 0) {
      continue; // Skip files with no relevant calls
    }

    console.log(`Processing file: ${filePath}`); // Log only if calls are found
    console.log(`  Found ${mutatorCalls.length} create/updateMutator calls.`);

    // Iterate backwards
    for (let i = mutatorCalls.length - 1; i >= 0; i--) {
      const callExpression = mutatorCalls[i];
      const originalFunctionName = callExpression.getExpression().getText(); // "createMutator" or "updateMutator"

      try {
        if (callExpression.wasForgotten()) {
          console.log("  -> Skipping forgotten node.");
          continue;
        }

        const parentStatement = callExpression.getAncestors().find(Node.isStatement);
        if (!parentStatement || !Node.isStatement(parentStatement)) {
          console.warn(
            `  -> Skipping call not directly within a statement: ${callExpression.getText().substring(0, 50)}...`
          );
          continue;
        }

        const args = callExpression.getArguments();
        if (args.length !== 1 || !Node.isObjectLiteralExpression(args[0])) {
          console.warn(
            `  -> Skipping ${originalFunctionName} call with unexpected arguments: ${callExpression
              .getText()
              .substring(0, 50)}...`
          );
          continue;
        }

        const optionsObject = args[0] as ObjectLiteralExpression;

        // --- Common Property Extraction ---
        const collectionProp = optionsObject.getProperty("collection") as PropertyAssignment | undefined;
        const contextProp = optionsObject.getProperty("context") as
          | PropertyAssignment
          | ShorthandPropertyAssignment
          | undefined;
        const currentUserProp = optionsObject.getProperty("currentUser") as PropertyAssignment | undefined;
        const validateProp = optionsObject.getProperty("validate") as PropertyAssignment | undefined;

        // --- Collection and New Function Name ---
        const collectionInitializer = collectionProp?.getInitializer();
        const collectionName = getBaseName(collectionInitializer);

        if (!collectionInitializer || !collectionName) {
          console.warn(
            `  -> Skipping ${originalFunctionName} call missing 'collection', or collection is not an Identifier or PropertyAccess: ${callExpression
              .getText()
              .substring(0, 50)}...`
          );
          continue;
        }

        let singularName = collectionName;
        if (collectionName.endsWith("s")) {
          singularName = collectionName.slice(0, -1);
        } else {
          console.warn(
            `  -> Collection name "${collectionName}" doesn't end with 's', using as is for function name prefix.`
          );
        }
        const functionPrefix = originalFunctionName === "createMutator" ? "create" : "update";
        const newFunctionName = `${functionPrefix}${pascalCase(singularName)}`;
        fileImportsToAdd.newMutatorFunctions.add(newFunctionName);

        // --- Context, CurrentUser, Validate (Common Logic) ---
        // Fix for context handling
        let contextText: string | undefined;
        if (contextProp) {
          if (Node.isPropertyAssignment(contextProp)) {
            contextText = contextProp.getInitializer()?.getText();
          } else if (Node.isShorthandPropertyAssignment(contextProp)) {
            // Handle { context } shorthand (equivalent to { context: context })
            contextText = contextProp.getName();
          }
        }

        const currentUserValue = currentUserProp?.getInitializer()?.getText();
        const validateValue = validateProp?.getInitializer();
        let contextArg = "";
        let contextComputationStatement: string | null = null;

        if (contextText) {
          contextArg = contextText;
        } else if (currentUserValue) {
          const contextVarName = "userContext";
          contextComputationStatement = `const ${contextVarName} = await computeContextFromUser({ user: ${currentUserValue}, isSSR: false });`;
          contextArg = contextVarName;
          fileImportsToAdd.computeContextFromUser = true;
          await ensureFunctionIsAsync(callExpression);
        } else {
          contextArg = `createAnonymousContext()`;
          fileImportsToAdd.createAnonymousContext = true;
        }

        const skipValidationArg = validateValue && Node.isFalseLiteral(validateValue);

        // --- Argument Construction (Specific to create/update) ---
        const newArgs: string[] = [];
        let firstArgObjectText = "";

        if (originalFunctionName === "createMutator") {
          const documentProp = optionsObject.getProperty("document") as PropertyAssignment | undefined;
          let documentInitializer = documentProp?.getInitializer();
          if (!documentInitializer) {
            console.warn(
              `  -> Skipping createMutator call missing 'document': ${callExpression.getText().substring(0, 50)}...`
            );
            continue;
          }
          if (Node.isAsExpression(documentInitializer)) {
            documentInitializer = documentInitializer.getExpression();
          }
          const documentText = documentInitializer.getText();
          firstArgObjectText = documentText; // Pass the document directly as first arg
        } else {
          // updateMutator logic
          const documentIdProp = optionsObject.getProperty("documentId") as PropertyAssignment | undefined;
          const dataProp = optionsObject.getProperty("data") as PropertyAssignment | undefined;
          const setProp = optionsObject.getProperty("set") as PropertyAssignment | undefined;
          const unsetProp = optionsObject.getProperty("unset") as PropertyAssignment | undefined;

          // 1. Handle documentId -> selector
          const documentIdInitializer = documentIdProp?.getInitializer();
          if (!documentIdInitializer) {
            console.warn(
              `  -> Skipping updateMutator call missing 'documentId': ${callExpression.getText().substring(0, 50)}...`
            );
            continue;
          }
          const documentIdText = documentIdInitializer.getText();
          const selectorObjectText = `{ _id: ${documentIdText} }`;

          // 2. Handle data, set, unset -> merged data object
          const dataParts: string[] = [];
          let dataInitializer = dataProp?.getInitializer();
          let setInitializer = setProp?.getInitializer();
          let unsetInitializer = unsetProp?.getInitializer();

          // Handle 'as' expressions
          if (dataInitializer && Node.isAsExpression(dataInitializer))
            dataInitializer = dataInitializer.getExpression();
          if (setInitializer && Node.isAsExpression(setInitializer)) setInitializer = setInitializer.getExpression();
          if (unsetInitializer && Node.isAsExpression(unsetInitializer))
            unsetInitializer = unsetInitializer.getExpression();

          const dataText = dataInitializer?.getText();
          const setText = setInitializer?.getText();
          const unsetText = unsetInitializer?.getText();
          let hasDataSource = false;
          let newDataObjectText = "{}";

          // First, check if we have a direct object literal for data that we can use directly
          if (dataInitializer && Node.isObjectLiteralExpression(dataInitializer)) {
            hasDataSource = true;
            // If it's an inline object literal without other sources, just use it directly
            if (!setText && !unsetText) {
              newDataObjectText = dataText ?? "{ /* TODO: Missing data fields? */ }";
            } else {
              // If we need to merge with other sources, spread it
              dataParts.push(`...${dataText}`);
            }
          } else if (dataText) {
            // For variables or other expressions, use spreading
            hasDataSource = true;
            dataParts.push(`...${dataText}`);
          }

          // Next handle set - similar approach
          if (setInitializer && Node.isObjectLiteralExpression(setInitializer)) {
            hasDataSource = true;
            // If data wasn't an object literal or we don't have data, and no unset
            if (dataParts.length === 0 && newDataObjectText === "{}" && !unsetText) {
              newDataObjectText = setText ?? "{ /* TODO: Missing set fields? */ }"; // Use set directly without spreading
            } else {
              // Otherwise we need to merge, so spread it
              dataParts.push(`...${setText}`);
            }
          } else if (setText) {
            // For variables or other expressions, use spreading
            hasDataSource = true;
            dataParts.push(`...${setText}`);
          }

          // Handle unset properties - always convert to field: null pairs
          if (unsetInitializer && Node.isObjectLiteralExpression(unsetInitializer)) {
            hasDataSource = true;
            const unsetProps = unsetInitializer.getProperties();
            for (const prop of unsetProps) {
              // Handle both PropertyAssignment (key: value) and ShorthandPropertyAssignment (key)
              if (Node.isPropertyAssignment(prop) || Node.isShorthandPropertyAssignment(prop)) {
                const propName = prop.getName();
                // Ensure property name doesn't need quotes if it's complex
                const needsQuotes = !Node.isIdentifier(prop.getNameNode()) || prop.getName().includes("-"); // Basic check
                const formattedPropName = needsQuotes ? `"${propName}"` : propName;
                dataParts.push(`${formattedPropName}: null`);
              }
            }
          } else if (unsetText) {
            hasDataSource = true;
            console.warn(
              `  -> Cannot automatically handle 'unset' when it's not an object literal: ${unsetText}. Adding TODO.`
            );
            // Insert comment before the statement
            const todoComment = `// TODO: Manually handle unset fields from variable '${unsetText}' in the data object below.`;
            if (!insertStatementBefore(parentStatement, todoComment)) {
              console.warn(`  -> Could not insert TODO comment for variable unset.`);
            }
            // Add a placeholder comment in the object itself too
            dataParts.push(`/* TODO: Handle unset from ${unsetText} */`);
          }

          // Final assembly of the data object
          // If we have accumulated parts but don't have a direct object, create merged object
          if (dataParts.length > 0) {
            newDataObjectText = `{ ${dataParts.join(", ")} }`;
          } else if (!hasDataSource) {
            // Add TODO comment if no data/set/unset found
            console.warn(`  -> No data/set/unset found for updateMutator call. Adding TODO.`);
            const todoComment = `// TODO: No data, set, or unset properties found for this updateMutator call: ${callExpression
              .getText()
              .substring(0, 50)}...`;
            if (!insertStatementBefore(parentStatement, todoComment)) {
              console.warn(`  -> Could not insert TODO comment for missing data/set/unset.`);
            }
            newDataObjectText = `{ /* TODO: Add data fields */ }`;
          }

          // update expects { data: ..., selector: ... }
          firstArgObjectText = `{ data: ${newDataObjectText}, selector: ${selectorObjectText} }`;
        }

        // --- Assemble Arguments ---
        newArgs.push(firstArgObjectText);
        newArgs.push(contextArg);
        if (skipValidationArg) {
          newArgs.push("true"); // Third argument is skipValidation = true
        }

        // --- Replacement ---
        const parent = callExpression.getParent();
        const wasAwaited = Node.isAwaitExpression(parent);
        const nodeToReplace = wasAwaited ? parent : callExpression;
        const newCallText = wasAwaited
          ? `await ${newFunctionName}(${newArgs.join(", ")})`
          : `${newFunctionName}(${newArgs.join(", ")})`;

        if (contextComputationStatement) {
          if (!insertStatementBefore(parentStatement, contextComputationStatement)) {
            console.warn(
              `  -> Could not insert context computation statement for: ${callExpression.getText().substring(0, 50)}...`
            );
          } else {
            console.log(`  -> Added context computation: ${contextComputationStatement}`);
          }
        }

        nodeToReplace.replaceWithText(newCallText);
        console.log(`  -> Replaced ${originalFunctionName} with: ${newCallText.substring(0, 100)}...`);

        fileChanged = true;
        changesMade = true;
      } catch (error: any) {
        console.error(`  -> Error processing ${originalFunctionName} call in ${filePath}: ${error.message}`);
        console.error(`     Call text: ${callExpression.getText().substring(0, 100)}...`);
        if (error.stack) {
          console.error(error.stack);
        }
      }
    }

    if (fileChanged) {
      filesChangedCount++;
      // Add necessary imports to this file
      if (fileImportsToAdd.computeContextFromUser) {
        addOrUpdateImport(sourceFile, ["computeContextFromUser"], "@/server/vulcan-lib/apollo-server/context"); // Adjust path
      }
      if (fileImportsToAdd.createAnonymousContext) {
        addOrUpdateImport(sourceFile, ["createAnonymousContext"], "@/server/vulcan-lib/createContexts"); // Adjust path
      }
      // Add imports for the new create/update functions used in *this file*
      // if (fileImportsToAdd.newMutatorFunctions.size > 0) {
      //   // *** Adjust this path to where your new functions are exported from ***
      //   addOrUpdateImport(sourceFile, Array.from(fileImportsToAdd.newMutatorFunctions), "~/modules/vulcan/mutations2");
      // }

      await sourceFile.save();
      console.log(`  Saved changes to ${filePath}`);
    } else {
      // Only log if we didn't find any calls initially and processed the file
      if (mutatorCalls.length > 0) {
        console.log(`  No applicable changes needed for ${filePath} despite finding calls.`);
      }
    }
  }

  if (changesMade) {
    console.log(`\nConversion complete. ${filesChangedCount} files were modified.`);
  } else {
    console.log("\nConversion complete. No files were modified.");
  }
}

runConversion().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
