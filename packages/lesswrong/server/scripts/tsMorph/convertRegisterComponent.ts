/* eslint-disable */
import path from "path";
import { Project, Node, SyntaxKind, VariableDeclaration, FunctionDeclaration, Identifier, IndentationText, QuoteKind, SourceFile } from "ts-morph";
import { JsxEmit } from "typescript";
import { startWorkerForBatch } from "./tsMorphWorker";

async function refactorSourceFile(sourceFile: SourceFile) {
  const registerComponentCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

  let madeChanges = false;

  registerComponentCalls.forEach(callExpr => {
    const expression = callExpr.getExpression();

    // Check if it's a call to 'registerComponent'
    if (Node.isIdentifier(expression) && expression.getText() === "registerComponent") {
      const args = callExpr.getArguments();

      // Ensure 'registerComponent' has at least two arguments
      // and the second argument (the component itself) is an Identifier
      if (args.length >= 2 && Node.isIdentifier(args[1])) {
        const componentIdentifierArg = args[1] as Identifier;

        // 1. Find and rename the component's declaration
        const componentSymbol = componentIdentifierArg.getSymbol();
        if (componentSymbol) {
          const declarations = componentSymbol.getDeclarations();
          if (declarations && declarations.length > 0) {
            // Assuming the first declaration is the primary one
            const componentDeclaration = declarations[0];

            if (Node.isVariableDeclaration(componentDeclaration) || Node.isFunctionDeclaration(componentDeclaration)) {
              const declarationNameNode = (componentDeclaration as VariableDeclaration | FunctionDeclaration).getNameNode();
              if (declarationNameNode) {
                const currentDeclarationName = declarationNameNode.getText();
                if (currentDeclarationName.endsWith("Inner")) {
                  const newComponentName = currentDeclarationName.slice(0, -5);
                  console.log(`Renaming component declaration ${currentDeclarationName} to ${newComponentName}`);
                  (componentDeclaration as VariableDeclaration | FunctionDeclaration).rename(newComponentName);
                  // Note: .rename() also updates all references, including componentIdentifierArg
                  madeChanges = true;
                } else {
                  console.log(`Component declaration ${currentDeclarationName} doesn't end with 'Inner'. Skipping rename.`);
                }
              }
            } else {
              console.warn(`Declaration for component argument ${componentIdentifierArg.getText()} (${componentDeclaration.getKindName()}) is not a VariableDeclaration or FunctionDeclaration. Cannot rename.`);
            }
          } else {
            console.warn(`Could not find declaration for component argument ${componentIdentifierArg.getText()}.`);
          }
        } else {
          console.warn(`Could not get symbol for component argument ${componentIdentifierArg.getText()}.`);
        }

        // 2. Propagate name change to registerComponent (handled by .rename() above)

        // 3. Export the variable that holds the result of 'registerComponent'
        //    e.g., const MyRegisteredComponent = registerComponent(...);
        //    becomes: export const MyRegisteredComponent = registerComponent(...);
        const parentVarDecl = callExpr.getParentIfKind(SyntaxKind.VariableDeclaration);
        if (parentVarDecl) {
          const varStatement = parentVarDecl.getParentIfKind(SyntaxKind.VariableStatement);
          if (varStatement && !varStatement.isExported()) {
            // Check if it's already part of an export (e.g. export default const foo = ... is not valid)
            // setIsExported(true) works for `const foo = ...` -> `export const foo = ...`
            varStatement.setIsExported(true);
            console.log(`Exported ${parentVarDecl.getName()}.`);
            madeChanges = true;
          }
        } else {
          // This codemod assumes registerComponent's result is assigned to a variable.
          // e.g. export default registerComponent(...) is not handled by this export logic.
          console.warn(`'registerComponent' call (first arg: ${args[0]?.getText()}) is not directly assigned to a variable. Automatic export might not apply.`);
        }
      } else if (args.length >= 2) {
        console.warn(`Second argument to 'registerComponent' (first arg: ${args[0]?.getText()}) is not an Identifier. Skipping component rename for this call.`);
      }
    }
  });

  // await sourceFile.save();

  return {
    filePath: sourceFile.getFilePath(),
    status: madeChanges ? 'modified' : 'no_changes_needed',
  } as const;
}

async function refactorComponentRegistrations(filePaths: string[]) {
  // const componentsDirPath = path.resolve(__dirname, '../../components');
  
  const project = new Project({
    // useInMemoryFileSystem: true,
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

  // console.log(`Discovering .tsx files in: ${componentsDirPath}/**/*.tsx`);
  // project.addSourceFilesAtPaths(`${componentsDirPath}/**/*.tsx`);
  project.addSourceFilesAtPaths(filePaths);

  const results = await Promise.all(project.getSourceFiles().map(refactorSourceFile));

  await project.save();
  
  return results;
}

startWorkerForBatch(refactorComponentRegistrations);