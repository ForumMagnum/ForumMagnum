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
        console.log(`  -> Made ancestor function/method async: ${'getName' in func ? func.getName() : "<anonymous>"}`);
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
    console.log(`Processing file: ${filePath}`);

    // Track imports needed specifically for *this* file
    const fileImportsToAdd = {
      computeContextFromUser: false,
      createAnonymousContext: false,
      newCreateFunctions: new Set<string>(),
    };

    // Use a loop that allows modification while iterating (e.g., process in reverse or re-query)
    // Getting all calls upfront and iterating is safer if replacements change node structure significantly
    const createMutatorCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter((callExpr) => {
      const expression = callExpr.getExpression();
      return Node.isIdentifier(expression) && expression.getText() === "createMutator";
    });

    if (createMutatorCalls.length === 0) {
      console.log(`  No createMutator calls found in ${filePath}.`);
      continue; // Skip files with no createMutator calls
    }

    console.log(`  Found ${createMutatorCalls.length} createMutator calls.`);

    // Iterate backwards to handle nested calls or multiple calls within a statement safely
    for (let i = createMutatorCalls.length - 1; i >= 0; i--) {
      const callExpression = createMutatorCalls[i];
      try {
        // Check if the node is still valid (might have been replaced by a previous iteration)
        if (callExpression.wasForgotten()) {
            console.log("  -> Skipping forgotten node.");
            continue;
        }

        const parentStatement = callExpression.getAncestors().find(Node.isStatement);
        if (!parentStatement || !Node.isStatement(parentStatement)) {
          console.warn(`  -> Skipping call not directly within a statement: ${callExpression.getText().substring(0, 50)}...`);
          continue;
        }

        const args = callExpression.getArguments();
        if (args.length !== 1 || !Node.isObjectLiteralExpression(args[0])) {
          console.warn(`  -> Skipping call with unexpected arguments: ${callExpression.getText().substring(0, 50)}...`);
          continue;
        }

        const optionsObject = args[0] as ObjectLiteralExpression;

        // Extract properties
        const collectionProp = optionsObject.getProperty("collection") as PropertyAssignment | undefined; // Make optional
        const documentProp = optionsObject.getProperty("document") as PropertyAssignment | undefined; // Make optional
        const contextProp = optionsObject.getProperty("context") as PropertyAssignment | undefined;
        const currentUserProp = optionsObject.getProperty("currentUser") as PropertyAssignment | undefined;
        const validateProp = optionsObject.getProperty("validate") as PropertyAssignment | undefined;

        // --- Updated Collection Handling ---
        const collectionInitializer = collectionProp?.getInitializer();
        const collectionName = getBaseName(collectionInitializer); // Use helper

        if (!collectionInitializer || !collectionName) {
          console.warn(
            `  -> Skipping call missing 'collection', or collection is not an Identifier or PropertyAccess: ${callExpression
              .getText()
              .substring(0, 50)}...`
          );
          continue;
        }
        // --- End Updated Collection Handling ---

        // --- Updated Document Handling ---
        let documentInitializer = documentProp?.getInitializer();
        if (!documentInitializer) {
           console.warn(
            `  -> Skipping call missing 'document': ${callExpression
              .getText()
              .substring(0, 50)}...`
          );
          continue;
        }
        // Handle 'as' expressions
        if (Node.isAsExpression(documentInitializer)) {
            documentInitializer = documentInitializer.getExpression();
        }
        // No longer checking if it's an ObjectLiteralExpression
        const documentText = documentInitializer.getText();
        // --- End Updated Document Handling ---


        // Attempt to singularize and format: MultiDocuments -> createMultiDocument
        // Handle potential pluralization inconsistencies (e.g., 'Messages' -> 'Message')
        let singularName = collectionName;
        if (collectionName.endsWith('s')) {
            singularName = collectionName.slice(0, -1);
        } else {
            console.warn(`  -> Collection name "${collectionName}" doesn't end with 's', using as is for function name.`);
            // Or implement more robust singularization if needed
        }
        const newFunctionName = `create${pascalCase(singularName)}`;
        fileImportsToAdd.newCreateFunctions.add(newFunctionName); // Track needed imports for this file

        const contextValue = contextProp?.getInitializer()?.getText(); // Handles shorthand
        const currentUserValue = currentUserProp?.getInitializer()?.getText(); // Handles shorthand
        const validateValue = validateProp?.getInitializer();

        const newArgs: string[] = [];

        // Argument 1: { data: documentObject }
        newArgs.push(`{ data: ${documentText} }`);

        // Argument 2: Context
        let contextArg = "";
        let contextComputationStatement: string | null = null;

        if (contextValue) {
          contextArg = contextValue;
        } else if (currentUserValue) {
          // Generate unique variable name for context
          const contextVarName = "userContext"; // Simple unique name
          contextComputationStatement = `const ${contextVarName} = await computeContextFromUser({ user: ${currentUserValue}, isSSR: false });`;
          contextArg = contextVarName;
          fileImportsToAdd.computeContextFromUser = true;
          await ensureFunctionIsAsync(callExpression); // Ensure parent function is async
        } else {
          contextArg = `createAnonymousContext()`;
          fileImportsToAdd.createAnonymousContext = true;
        }
        newArgs.push(contextArg);

        // Argument 3: Skip Validation (true if validate was false)
        if (validateValue && Node.isFalseLiteral(validateValue)) {
          newArgs.push("true");
        }

        // Construct the new call text
        const wasAwaited = Node.isAwaitExpression(callExpression.getParent());
        const newCallText = `${wasAwaited ? "await " : ""}${newFunctionName}(${newArgs.join(", ")})`;

        // Replace the old call
        const replacementNode = wasAwaited ? callExpression.getParent() : callExpression;

        if (contextComputationStatement) {
          // Insert context computation statement before the statement containing the call
          const insertionIndex = parentStatement.getChildIndex();
          const parentContainer = parentStatement.getParent(); // e.g., Block, SourceFile, etc.

          // Check if parentContainer has `insertStatements` method (like Block, SourceFile)
          if (parentContainer && typeof (parentContainer as any).insertStatements === 'function') {
             (parentContainer as any).insertStatements(insertionIndex, contextComputationStatement);
             console.log(`  -> Added context computation: ${contextComputationStatement}`);
          } else {
             console.warn(`  -> Could not insert context computation statement for: ${callExpression.getText().substring(0,50)}... Parent container type: ${parentContainer?.getKindName()}`);
             // Fallback or error handling needed? Maybe insert as text if desperate?
             // For now, we'll proceed without inserting the statement if the container is unexpected.
          }
        }

        // Replace the original node with the new call text
        // Important: Use replaceWithText on the *correct* node (await or call)
        replacementNode?.replaceWithText(newCallText);
        console.log(`  -> Replaced with: ${newCallText.substring(0, 100)}...`);

        fileChanged = true;
        changesMade = true;
      } catch (error: any) {
        console.error(`  -> Error processing call in ${filePath}: ${error.message}`);
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
        // Assuming computeContextFromUser is in a specific file, adjust path as needed
        addOrUpdateImport(sourceFile, ["computeContextFromUser"], "@/server/vulcan-lib/apollo-server/context"); // Adjust path
      }
      if (fileImportsToAdd.createAnonymousContext) {
        // Assuming createAnonymousContext is in a specific file, adjust path as needed
        addOrUpdateImport(sourceFile, ["createAnonymousContext"], "@/server/vulcan-lib/createContexts"); // Adjust path
      }
      // Add imports for the new create functions (assuming they are exported from a central place)
      // You might need more sophisticated logic if they come from different files
      // if (importsToAdd.newCreateFunctions.size > 0) {
        // addOrUpdateImport(sourceFile, Array.from(importsToAdd.newCreateFunctions), "~/modules/vulcan/mutations2"); // Adjust path
      // }

      // Reset file-specific import flags
      fileImportsToAdd.computeContextFromUser = false;
      fileImportsToAdd.createAnonymousContext = false;
      fileImportsToAdd.newCreateFunctions.clear();

      await sourceFile.save();
      console.log(`  Saved changes to ${filePath}`);
    } else {
      // Only log if we didn't find any calls initially
      if (createMutatorCalls.length > 0) {
          console.log(`  No applicable changes needed for ${filePath} despite finding calls.`);
      }
    }
  }

  if (changesMade) {
    console.log(`\nConversion complete. ${filesChangedCount} files were modified.`);
    // Optional: Format the changed files using Prettier or ESLint
    // await project.save(); // Already saved individually
  } else {
    console.log("\nConversion complete. No files were modified.");
  }
}

runConversion().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
