import { ImportDeclaration, Project, SourceFile, SyntaxKind } from "ts-morph";
import path from "path";
import filter from 'lodash/filter';

const cwd = process.cwd();

interface ImportInfo {
  path: string;
  asDefault: boolean;
}

export async function main() {
  const project = new Project({
    tsConfigFilePath: "tsconfig.json",
    skipAddingFilesFromTsConfig: false,
  });
  
  const allSourceFiles = project.getSourceFiles();
  
  // For all component files, ensure components are exported.
  const componentFiles = filter(allSourceFiles, f => {
    const relativePath = path.relative(cwd, f.getFilePath());
    return relativePath.toLowerCase().endsWith(".tsx")
      && relativePath.startsWith("lesswrong/packages/lesswrong/components/")
  });
  
  const importsDict: Record<string,ImportInfo> = {};
  for (const componentFile of componentFiles) {
    ensureComponentExports(componentFile, getPathForImport(componentFile), importsDict);
  }
  for (const componentFile of componentFiles) {
    replaceDestructuringWithImport(componentFile, getPathForImport(componentFile), componentFile.getFilePath(), importsDict);
  }
  
  // Find destructurings of Components, and replace them with normal imports.

  project.saveSync();
}

function getPathForImport(sourceFile: SourceFile) {
  const relativePath = path.relative(cwd, sourceFile.getFilePath());
  return relativePath.replace("lesswrong/packages/lesswrong/components/", "@/components/").replace(/\.tsx$/, "");
}

function importPathToAbsolute(importPath: string) {
  return importPath.replace("@/components", cwd+"/lesswrong/packages/lesswrong/components");
}

function ensureComponentExports(componentFile: SourceFile, path: string, importsDict: Record<string,ImportInfo>): void { //{{_}}
  // Find all calls to registerComponent at the top level
  const registerComponentCalls = componentFile
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter(callExpr => {
      // Only consider top-level calls (parent is a variable declaration)
      const isTopLevel = callExpr.getParent()?.getKind() === SyntaxKind.VariableDeclaration;
      // Only consider calls to registerComponent
      const identifier = callExpr.getExpression();
      const isRegisterComponent = identifier.getText() === 'registerComponent';
      
      return isTopLevel && isRegisterComponent;
    });

  if (registerComponentCalls.length === 0) {
    return; // No components to export
  }

  // Check if there's already a default export
  const hasDefaultExport = componentFile
    .getDescendantsOfKind(SyntaxKind.ExportKeyword)
    .some(exportKeyword => {
      const parent = exportKeyword.getParent();
      return parent && parent.getKind() === SyntaxKind.ExportAssignment;
    });

  if (registerComponentCalls.length === 1 && !hasDefaultExport) {
    // Handle single component case
    const callExpr = registerComponentCalls[0];
    const variableDeclaration = callExpr.getParent();
    
    if (variableDeclaration && variableDeclaration.getKind() === SyntaxKind.VariableDeclaration) {
      // Get the name identifier from the variable declaration
      const nameNode = variableDeclaration.getFirstDescendantByKind(SyntaxKind.Identifier);
      const componentName = nameNode?.getText();
      
      if (componentName) {
        // Insert the default export at the end of the file
        componentFile.addStatements(
          `\nexport default ${componentName};`
        );
        importsDict[componentName.replace(/Component$/, '')] = {path, asDefault: true};
      }
    }
  } else {
    // Handle multi-component case
    // Extract component data for each registered component
    const components = registerComponentCalls.map(callExpr => {
      const variableDeclaration = callExpr.getParent();
      if (!variableDeclaration || variableDeclaration.getKind() !== SyntaxKind.VariableDeclaration) {
        return null;
      }
      
      // Get the name identifier from the variable declaration
      const nameNode = variableDeclaration.getFirstDescendantByKind(SyntaxKind.Identifier);
      const componentVarName = nameNode?.getText();
      
      if (!componentVarName) {
        return null;
      }
      
      // Get the first argument of registerComponent which is the component name
      const args = callExpr.getArguments();
      if (args.length === 0) {
        return null;
      }
      
      const firstArg = args[0];
      let componentName: string | null = null;
      
      if (firstArg.getKind() === SyntaxKind.StringLiteral) {
        componentName = firstArg.getText().replace(/['\"]/g, '');
      }
      
      return { varName: componentVarName, name: componentName };
    }).filter((component): component is { varName: string, name: string } => 
      component !== null && component.name !== null
    );
    
    if (components.length > 0) {
      // Create the export statement
      const exportBlock = `\nexport {\n${components
        .map(comp => `  ${comp.varName} as ${comp.name}`)
        .join(',\n')}\n}`;
      
      componentFile.addStatements(exportBlock);
      for (const comp of components) {
        importsDict[comp.name] = {path, asDefault: false};
      }
    }
  }
}

function replaceDestructuringWithImport(
  componentFile: SourceFile,
  thisFileImportPath: string,
  thisFileAbsPath: string,
  importsDict: Record<string, ImportInfo>
) {
  // Track imports that need to be added
  const importsToAdd: Record<string, { names: string[]; asDefault: string[] }> = {};

  // Step 1: Handle destructuring assignments from Components
  const destructuringAssignments = componentFile.getDescendantsOfKind(
    SyntaxKind.VariableDeclaration
  ).filter(declaration => {
    const initializer = declaration.getInitializer();
    return (
      declaration.getNameNode().getKind() === SyntaxKind.ObjectBindingPattern &&
      initializer &&
      initializer.getText() === "Components"
    );
  });

  // Process each destructuring assignment
  for (const declaration of destructuringAssignments) {
    const bindingPattern = declaration.getNameNode();
    if (bindingPattern.getKind() === SyntaxKind.ObjectBindingPattern) {
      const elements = bindingPattern.getChildrenOfKind(SyntaxKind.BindingElement);
      
      // Process each destructured component
      for (const element of elements) {
        const componentName = element.getNameNode().getText();
        
        if (componentName in importsDict) {
          // Track this component for import
          const { path, asDefault } = importsDict[componentName];
          if (!importsToAdd[path]) {
            importsToAdd[path] = { names: [], asDefault: [] };
          }
          
          if (asDefault) {
            if (!importsToAdd[path].asDefault.includes(componentName)) {
              importsToAdd[path].asDefault.push(componentName);
            }
          } else {
            if (!importsToAdd[path].names.includes(componentName)) {
              importsToAdd[path].names.push(componentName);
            }
          }
        } else {
          console.error(`Don't know how to import ${componentName}`);
        }
      }
    }
    
    // Remove the destructuring assignment entirely
    declaration.getVariableStatement()?.remove();
  }

  // Step 2: Handle Components.X property access expressions
  const propertyAccesses = componentFile.getDescendantsOfKind(
    SyntaxKind.PropertyAccessExpression
  ).filter(access => 
    access.getExpression().getText() === "Components"
  );

  // Process each property access in reverse to avoid position issues
  for (const access of [...propertyAccesses].reverse()) {
    const componentName = access.getName();
    
    if (componentName in importsDict) {
      // Add to imports
      const { path, asDefault } = importsDict[componentName];
      if (!importsToAdd[path]) {
        importsToAdd[path] = { names: [], asDefault: [] };
      }
      
      if (asDefault) {
        if (!importsToAdd[path].asDefault.includes(componentName)) {
          importsToAdd[path].asDefault.push(componentName);
        }
      } else {
        if (!importsToAdd[path].names.includes(componentName)) {
          importsToAdd[path].names.push(componentName);
        }
      }
      
      // Replace Components.X with just X
      access.replaceWithText(componentName);
    }
  }

  // Step 3: Add the necessary imports
  for (const [importedPath, { names, asDefault }] of Object.entries(importsToAdd)) {
    if (thisFileImportPath === importedPath) {
      // Don't self-import
      continue;
    }
    const existingImport = componentFile.getImportDeclaration(imp => {
      const importSpecifier = imp.getModuleSpecifier().getLiteralText();
      const importedModule = path.resolve(thisFileAbsPath, importSpecifier);
      return stripExtension(importedModule) === stripExtension(importPathToAbsolute(importedPath));
    });
    
    if (existingImport) {
      console.log(`In ${thisFileImportPath}, will add ${importedPath} to existing import`);
      if (names.length > 0) {
        existingImport.addNamedImports(names);
      }
      if (asDefault.length > 0 && !existingImport.getDefaultImport()) {
        existingImport.setDefaultImport(asDefault[0]);
      }
    } else {
      // Add named imports
      if (names.length > 0) {
        componentFile.addImportDeclaration({
          namedImports: names,
          moduleSpecifier: importedPath,
        });
      }
      
      // Add default imports (each as a separate import declaration)
      for (const name of asDefault) {
        componentFile.addImportDeclaration({
          defaultImport: name,
          moduleSpecifier: importedPath,
        });
      }
    }
  }
}

function stripExtension(path: string): string {
  return path.replace(/\.tsx?$/, "");
}

function sleep(delayMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

main()