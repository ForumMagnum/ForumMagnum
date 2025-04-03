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

  const importsToAdd = {
    computeContextFromUser: false,
    createAnonymousContext: false,
    newCreateFunctions: new Set<string>(),
  };

  for (const sourceFile of allSourceFiles) {
    let fileChanged = false;
    const filePath = sourceFile.getFilePath();
    console.log(`Processing file: ${filePath}`);

    const createMutatorCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).filter((callExpr) => {
      const expression = callExpr.getExpression();
      return Node.isIdentifier(expression) && expression.getText() === "createMutator";
    });

    if (createMutatorCalls.length === 0) {
      continue; // Skip files with no createMutator calls
    }

    console.log(`  Found ${createMutatorCalls.length} createMutator calls.`);

    for (const callExpression of createMutatorCalls) {
      try {
        const parentStatement =
          callExpression.getParentIfKind(SyntaxKind.ExpressionStatement) ??
          callExpression.getAncestors().find(Node.isStatement);
        if (!parentStatement || !Node.isStatement(parentStatement)) {
          console.warn(`  -> Skipping call inside complex expression: ${callExpression.getText().substring(0, 50)}...`);
          continue;
        }

        const args = callExpression.getArguments();
        if (args.length !== 1 || !Node.isObjectLiteralExpression(args[0])) {
          console.warn(`  -> Skipping call with unexpected arguments: ${callExpression.getText().substring(0, 50)}...`);
          continue;
        }

        const optionsObject = args[0] as ObjectLiteralExpression;

        // Extract properties
        const collectionProp = optionsObject.getProperty("collection") as PropertyAssignment;
        const documentProp = optionsObject.getProperty("document") as PropertyAssignment;
        const contextProp = optionsObject.getProperty("context") as PropertyAssignment | undefined;
        const currentUserProp = optionsObject.getProperty("currentUser") as PropertyAssignment | undefined;
        const validateProp = optionsObject.getProperty("validate") as PropertyAssignment | undefined;

        if (!collectionProp || !documentProp || !Node.isIdentifier(collectionProp.getInitializer())) {
          console.warn(
            `  -> Skipping call missing 'collection' or 'document', or collection is not an Identifier: ${callExpression
              .getText()
              .substring(0, 50)}...`
          );
          continue;
        }

        const collectionIdentifier = collectionProp.getInitializer() as Identifier;
        const collectionName = collectionIdentifier.getText();
        // Attempt to singularize and format: MultiDocuments -> createMultiDocument
        const singularName = collectionName.slice(0, -1);
        const newFunctionName = `create${pascalCase(singularName)}`;
        importsToAdd.newCreateFunctions.add(newFunctionName); // Track needed imports

        const documentObject = documentProp.getInitializer();
        if (!documentObject || !Node.isObjectLiteralExpression(documentObject)) {
          console.warn(
            `  -> Skipping call where 'document' is not an Object Literal: ${callExpression
              .getText()
              .substring(0, 50)}...`
          );
          continue;
        }
        const documentText = documentObject.getText();

        const contextValue = contextProp?.getInitializer()?.getText();
        const currentUserValue = currentUserProp?.getInitializer()?.getText();
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
          const contextVarName = "userContext_" + Math.random().toString(36).substring(2, 7); // Simple unique name
          contextComputationStatement = `const ${contextVarName} = await computeContextFromUser({ user: ${currentUserValue}, isSSR: false });`;
          contextArg = contextVarName;
          importsToAdd.computeContextFromUser = true;
          await ensureFunctionIsAsync(callExpression); // Ensure parent function is async
        } else {
          contextArg = `createAnonymousContext()`;
          importsToAdd.createAnonymousContext = true;
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
          const parentList = parentStatement.getParentSyntaxList();
          if (parentList) {
            parentList.insertChildText(insertionIndex, contextComputationStatement + "\n");
          }
          console.log(`  -> Added context computation: ${contextComputationStatement}`);
        }

        // Replace the original call (or await expression) with the new call text
        replacementNode?.replaceWithText(newCallText);
        console.log(`  -> Replaced with: ${newCallText.substring(0, 100)}...`);

        fileChanged = true;
        changesMade = true;
      } catch (error: any) {
        console.error(`  -> Error processing call in ${filePath}: ${error.message}`);
        console.error(`     Call text: ${callExpression.getText().substring(0, 100)}...`);
      }
    }

    if (fileChanged) {
      filesChangedCount++;
      // Add necessary imports to this file
      if (importsToAdd.computeContextFromUser) {
        // Assuming computeContextFromUser is in a specific file, adjust path as needed
        addOrUpdateImport(sourceFile, ["computeContextFromUser"], "~/modules/apollo/context"); // Adjust path
      }
      if (importsToAdd.createAnonymousContext) {
        // Assuming createAnonymousContext is in a specific file, adjust path as needed
        addOrUpdateImport(sourceFile, ["createAnonymousContext"], "~/modules/apollo/context"); // Adjust path
      }
      // Add imports for the new create functions (assuming they are exported from a central place)
      // You might need more sophisticated logic if they come from different files
      if (importsToAdd.newCreateFunctions.size > 0) {
        addOrUpdateImport(sourceFile, Array.from(importsToAdd.newCreateFunctions), "~/modules/vulcan/mutations2"); // Adjust path
      }

      // Reset file-specific import flags
      importsToAdd.computeContextFromUser = false;
      importsToAdd.createAnonymousContext = false;
      importsToAdd.newCreateFunctions.clear();

      await sourceFile.save();
      console.log(`  Saved changes to ${filePath}`);
    } else {
      console.log(`  No changes needed for ${filePath}`);
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
