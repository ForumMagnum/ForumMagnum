import { Project, SourceFile, ImportDeclaration, SyntaxKind } from "ts-morph";
import path from "path";
import filter from 'lodash/filter';

const cwd = process.cwd();
const MATERIAL_UI_CORE_IMPORT = '@material-ui/core';
const MATERIAL_UI_REPLACEMENTS_PATH = '@/components/mui-replacement';

export async function main() {
  console.log("Starting Material-UI imports replacement codemod...");
  
  const project = new Project({
    tsConfigFilePath: "tsconfig.json",
    skipAddingFilesFromTsConfig: false,
  });
  
  const allSourceFiles = project.getSourceFiles();
  console.log(`Analyzing ${allSourceFiles.length} source files...`);
  
  // Filter to only include files that import from material-ui/core
  const filesWithMaterialImports = filter(allSourceFiles, file => {
    const imports = file.getImportDeclarations();
    return imports.some(imp => 
      imp.getModuleSpecifierValue() === MATERIAL_UI_CORE_IMPORT ||
      imp.getModuleSpecifierValue().startsWith(`${MATERIAL_UI_CORE_IMPORT}/`)
    );
  });
  
  console.log(`Found ${filesWithMaterialImports.length} files with Material-UI imports`);
  
  // Process each file with Material-UI imports
  for (const sourceFile of filesWithMaterialImports) {
    replaceMaterialUIImports(sourceFile);
  }
  
  // Save all changes
  project.saveSync();
  console.log("Material-UI imports replacement completed successfully!");
}

function replaceMaterialUIImports(sourceFile: SourceFile): void {
  const filePath = sourceFile.getFilePath();
  const relativePath = path.relative(cwd, filePath);
  console.log(`Processing ${relativePath}...`);
  
  // Get all import declarations
  const importDeclarations = sourceFile.getImportDeclarations();
  
  // Track imports to add
  const newImports: Record<string, string[]> = {};
  
  // Process each import declaration
  for (const importDecl of importDeclarations) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    
    // Check if this is a material-ui/core import
    if (moduleSpecifier === MATERIAL_UI_CORE_IMPORT) {
      // Handle main material-ui/core import
      processMainMaterialUIImport(importDecl, newImports);
    } else if (moduleSpecifier.startsWith(`${MATERIAL_UI_CORE_IMPORT}/`)) {
      // Handle submodule imports like @material-ui/core/Button
      processSubmoduleMaterialUIImport(importDecl, newImports);
    }
  }
  
  // Add new imports
  for (const [importPath, components] of Object.entries(newImports)) {
    if (components.length > 0) {
      sourceFile.addImportDeclaration({
        namedImports: components,
        moduleSpecifier: importPath,
      });
    }
  }
}

function processMainMaterialUIImport(
  importDecl: ImportDeclaration, 
  newImports: Record<string, string[]>
): void {
  // Get named imports
  const namedImports = importDecl.getNamedImports();
  
  if (namedImports.length === 0) {
    // No named imports, nothing to replace
    return;
  }
  
  // Initialize the replacements import if not already present
  if (!newImports[MATERIAL_UI_REPLACEMENTS_PATH]) {
    newImports[MATERIAL_UI_REPLACEMENTS_PATH] = [];
  }
  
  // Add each component to the new imports
  for (const namedImport of namedImports) {
    const componentName = namedImport.getName();
    const alias = namedImport.getAliasNode()?.getText();
    
    if (alias) {
      // If there's an alias, preserve it
      newImports[MATERIAL_UI_REPLACEMENTS_PATH].push(`${componentName} as ${alias}`);
    } else {
      newImports[MATERIAL_UI_REPLACEMENTS_PATH].push(componentName);
    }
  }
  
  // Remove the original import
  importDecl.remove();
}

function processSubmoduleMaterialUIImport(
  importDecl: ImportDeclaration, 
  newImports: Record<string, string[]>
): void {
  const moduleSpecifier = importDecl.getModuleSpecifierValue();
  // Extract the component name from the path (e.g., "@material-ui/core/Button" -> "Button")
  const componentName = path.basename(moduleSpecifier);
  
  // Initialize the replacements import if not already present
  if (!newImports[MATERIAL_UI_REPLACEMENTS_PATH]) {
    newImports[MATERIAL_UI_REPLACEMENTS_PATH] = [];
  }
  
  // Handle default imports
  const defaultImport = importDecl.getDefaultImport();
  if (defaultImport) {
    const defaultImportName = defaultImport.getText();
    if (defaultImportName !== componentName) {
      // If the default import has a different name, use it as an alias
      newImports[MATERIAL_UI_REPLACEMENTS_PATH].push(`${componentName} as ${defaultImportName}`);
    } else {
      newImports[MATERIAL_UI_REPLACEMENTS_PATH].push(componentName);
    }
  }
  
  // Handle named imports (less common with submodule imports, but possible)
  const namedImports = importDecl.getNamedImports();
  for (const namedImport of namedImports) {
    const importName = namedImport.getName();
    const alias = namedImport.getAliasNode()?.getText();
    
    if (alias) {
      newImports[MATERIAL_UI_REPLACEMENTS_PATH].push(`${importName} as ${alias}`);
    } else {
      newImports[MATERIAL_UI_REPLACEMENTS_PATH].push(importName);
    }
  }
  
  // Remove the original import
  importDecl.remove();
}

function stripExtension(path: string): string {
  return path.replace(/\.tsx?$/, "");
}

function sleep(delayMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delayMs));
}

// Run the codemod
main().catch(error => {
  console.error("Error running Material-UI imports replacement codemod:", error);
  process.exit(1);
}); 