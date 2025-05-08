"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts_morph_1 = require("ts-morph");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const tsMorphWorker_1 = require("./tsMorphWorker");
const worker_threads_1 = require("worker_threads");
// Cache for component locations
// Key: ComponentName (string used in Components.X or registerComponent)
// Value: { path: string; exportName: string; isDefault: boolean; }
let componentLocationCache = null;
const CACHE_FILE_NAME = '.component-cache.json'; // Define cache file name
function getRelativePath(fromPath, toPath) {
    let relative = path_1.default.relative(path_1.default.dirname(fromPath), toPath);
    relative = relative.replace(/\.(tsx|ts|js|jsx)$/, ''); // Remove extension
    if (!relative.startsWith('.') && !relative.startsWith('..')) {
        relative = './' + relative;
    }
    return relative.replace(/\\/g, '/'); // Ensure forward slashes
}
async function initializeComponentCacheIfNeeded(projectForCache) {
    if (componentLocationCache)
        return;
    const projectRootDir = path_1.default.dirname(__dirname);
    const cacheFilePath = path_1.default.join(projectRootDir, CACHE_FILE_NAME);
    // Try to load from file system cache
    if (fs_1.default.existsSync(cacheFilePath)) {
        try {
            console.log(`Worker: Attempting to load component cache from ${cacheFilePath}`);
            const fileContent = fs_1.default.readFileSync(cacheFilePath, 'utf-8');
            const parsedCache = JSON.parse(fileContent);
            componentLocationCache = new Map(parsedCache);
            console.log(`Worker: Component cache loaded successfully from ${cacheFilePath} with ${componentLocationCache.size} components.`);
            // For debugging cache content:
            // componentLocationCache.forEach((v, k) => console.log(`CACHE (loaded): ${k} -> ${JSON.stringify(v)}`));
            return;
        }
        catch (error) {
            console.warn(`Worker: Failed to load component cache from ${cacheFilePath}. Will rebuild. Error:`, error);
            // Invalidate potentially corrupt cache file or handle error appropriately
            // For simplicity, we'll just proceed to rebuild. Could delete the corrupt file:
            // try { fs.unlinkSync(cacheFilePath); } catch (e) { console.warn(`Worker: Could not delete corrupt cache file ${cacheFilePath}`, e); }
            componentLocationCache = null; // Ensure it's reset if loading failed mid-way
        }
    }
    console.log(`Worker: Initializing component cache by scanning source files (cache file not found or loading failed).`);
    componentLocationCache = new Map();
    const sourceFiles = projectForCache.getSourceFiles();
    for (const sourceFile of sourceFiles) {
        const filePath = sourceFile.getFilePath();
        // 1. Handle standard named exports
        sourceFile.getExportedDeclarations().forEach((declarations, exportedName) => {
            // Check if this name is already cached as a default export from registerComponent.
            // If so, the default export version (linked to the registerComponent string) might be preferred
            // for lookups via `Components.ComponentName`.
            // However, `getExportedDeclarations` gives us the actual exported identifiers.
            if (!componentLocationCache.has(exportedName) || !componentLocationCache.get(exportedName).isDefault) {
                componentLocationCache.set(exportedName, {
                    path: filePath,
                    exportName: exportedName,
                    isDefault: false,
                });
            }
        });
        // 2. Handle `export default registerComponent('ComponentName', ...)`
        const defaultExportNode = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.ExportAssignment)
            .find(ea => ea.isExportEquals() === false); // Finds `export default ...`
        if (defaultExportNode) {
            const expression = defaultExportNode.getExpression();
            if (ts_morph_1.Node.isCallExpression(expression) && ts_morph_1.Node.isIdentifier(expression.getExpression()) && expression.getExpression().getText() === 'registerComponent') {
                const args = expression.getArguments();
                if (args.length > 0 && ts_morph_1.Node.isStringLiteral(args[0])) {
                    const registeredName = args[0].getLiteralText();
                    // This registeredName is key for `Components.registeredName` lookups.
                    // It should point to a default import.
                    componentLocationCache.set(registeredName, {
                        path: filePath,
                        exportName: registeredName, // We'll import the default export and name it this.
                        isDefault: true,
                    });
                }
            }
        }
    }
    console.log(`Worker: Component cache initialized with ${componentLocationCache.size} components by scanning.`);
    // Save the newly built cache to the file system
    if (componentLocationCache && componentLocationCache.size > 0) {
        try {
            console.log(`Worker: Saving component cache to ${cacheFilePath}`);
            const serializedCache = JSON.stringify(Array.from(componentLocationCache.entries()), null, 2);
            fs_1.default.writeFileSync(cacheFilePath, serializedCache, 'utf-8');
            console.log(`Worker: Component cache saved successfully to ${cacheFilePath}.`);
        }
        catch (error) {
            console.error(`Worker: Failed to save component cache to ${cacheFilePath}. Error:`, error);
        }
    }
    // For debugging cache content:
    // componentLocationCache.forEach((v, k) => console.log(`CACHE (built): ${k} -> ${JSON.stringify(v)}`));
}
async function processFile(project, filePath) {
    const sourceFile = project.getSourceFile(filePath);
    if (!sourceFile) {
        return { status: 'error', error: `File not found in project: ${filePath}` };
    }
    if (!componentLocationCache) {
        return { status: 'error', error: 'Component cache not initialized!' };
    }
    let modified = false;
    // modulePath -> { defaultImport?: string, namedImports: Map<actualExportName, aliasName | undefined> }
    const componentsToImport = new Map();
    const vulcanLibImportPathSuffix = 'lib/vulcan-lib/components';
    // We still find the initial componentsIdentifierName to know what we're looking for.
    // However, the componentsImportDeclaration variable itself will not be used for modification in step 4.
    let componentsIdentifierName;
    let initialComponentsImportDeclaration; // Store for initial check
    // ***** START DEBUG LOGGING for componentsIdentifierName initialization *****
    if (filePath.includes('AFApplicationForm')) {
        console.log(`Worker: [DEBUG] File: ${filePath} - Initializing componentsIdentifierName. Current value: ${componentsIdentifierName}`);
    }
    // ***** END DEBUG LOGGING *****
    sourceFile.getImportDeclarations().forEach((importDecl, index) => {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        // ***** START DEBUG LOGGING for each import declaration *****
        if (filePath.includes('AFApplicationForm')) {
            console.log(`Worker: [DEBUG] File: ${filePath} - Checking Import #${index}: ModuleSpecifier='${moduleSpecifier}'`);
            console.log(`Worker: [DEBUG]   Does '${moduleSpecifier}' end with '${vulcanLibImportPathSuffix}'? ${moduleSpecifier.endsWith(vulcanLibImportPathSuffix)}`);
        }
        // ***** END DEBUG LOGGING *****
        if (moduleSpecifier.endsWith(vulcanLibImportPathSuffix)) {
            const componentsImport = importDecl.getNamedImports().find(ni => ni.getNameNode().getText() === 'Components');
            // ***** START DEBUG LOGGING for matching import *****
            if (filePath.includes('AFApplicationForm')) {
                console.log(`Worker: [DEBUG] File: ${filePath} - Matched suffix for ModuleSpecifier='${moduleSpecifier}'.`);
                console.log(`Worker: [DEBUG]   Found 'Components' named import? ${!!componentsImport}`);
            }
            // ***** END DEBUG LOGGING *****
            if (componentsImport) {
                initialComponentsImportDeclaration = importDecl;
                componentsIdentifierName = componentsImport.getAliasNode()?.getText() || componentsImport.getNameNode().getText();
                // ***** START DEBUG LOGGING when componentsIdentifierName is set *****
                if (filePath.includes('AFApplicationForm')) {
                    console.log(`Worker: [DEBUG] File: ${filePath} - SET componentsIdentifierName TO: '${componentsIdentifierName}'`);
                }
                // ***** END DEBUG LOGGING *****
            }
        }
    });
    // ***** START DEBUG LOGGING for componentsIdentifierName after loop *****
    if (filePath.includes('AFApplicationForm')) {
        console.log(`Worker: [DEBUG] File: ${filePath} - After import scan, componentsIdentifierName: '${componentsIdentifierName}'`);
    }
    // ***** END DEBUG LOGGING *****
    if (!componentsIdentifierName) {
        // ***** START DEBUG LOGGING for early exit *****
        if (filePath.includes('AFApplicationForm')) {
            console.log(`Worker: [DEBUG] File: ${filePath} - componentsIdentifierName is still UNDEFINED. Returning 'no_changes_needed'.`);
        }
        // ***** END DEBUG LOGGING *****
        const text = sourceFile.getFullText();
        if (text.includes("Components.") || text.match(/=\s*Components\b/)) {
            // console.log(`Worker: ${filePath} uses 'Components' but not via the expected import from '${vulcanLibImportPathSuffix}'. Skipping this file for this transform.`);
        }
        return { status: 'no_changes_needed' };
    }
    // ***** START DEBUG LOGGING if proceeding *****
    if (filePath.includes('AFApplicationForm')) {
        console.log(`Worker: [DEBUG] File: ${filePath} - componentsIdentifierName IS DEFINED ('${componentsIdentifierName}'). Proceeding to transformations.`);
    }
    // ***** END DEBUG LOGGING *****
    // 1. Handle `Components.ComponentName` (Property Access)
    const propertyAccesses = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.PropertyAccessExpression);
    for (const pae of propertyAccesses) {
        if (pae.getExpression().getText() === componentsIdentifierName) {
            const componentName = pae.getName(); // This is the name used in `Components.X`
            const cacheEntry = componentLocationCache.get(componentName);
            if (cacheEntry) {
                const componentDiskPath = cacheEntry.path;
                if (!componentsToImport.has(componentDiskPath)) {
                    componentsToImport.set(componentDiskPath, { namedImports: new Map() });
                }
                const importInfo = componentsToImport.get(componentDiskPath);
                if (cacheEntry.isDefault) {
                    importInfo.defaultImport = cacheEntry.exportName; // Use the name from registerComponent string
                }
                else {
                    // If componentName (used in Components.X) is different from actual cacheEntry.exportName, it's an implicit alias
                    if (componentName !== cacheEntry.exportName) {
                        importInfo.namedImports.set(cacheEntry.exportName, componentName); // import { exportName as componentName }
                    }
                    else {
                        importInfo.namedImports.set(cacheEntry.exportName, undefined); // import { exportName }
                    }
                }
                pae.replaceWithText(componentName); // Replace Components.X with X
                modified = true;
            }
            else {
                console.warn(`Worker: [WARN] Could not find location for component '${componentName}' accessed via '${componentsIdentifierName}.${componentName}' in ${filePath}. It will not be replaced.`);
            }
        }
    }
    // 2. Handle Destructuring: `const { C1, C2 } = Components;`
    const varStatements = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.VariableStatement);
    for (const varStmt of varStatements) {
        // If varStmt has been removed by a previous iteration's modification (e.g., a decl inside it was removed,
        // and then the varStmt itself became empty and was removed), then varStmt.wasForgotten() would be true.
        if (varStmt.wasForgotten()) {
            if (filePath.includes('AFApplicationForm')) {
                console.log(`Worker: [DEBUG] File: ${filePath} - varStmt ('${varStmt.getText().split('\n')[0]}...') was forgotten. Skipping.`);
            }
            continue; // Skip this varStmt as it's no longer valid
        }
        // Get the declarations ONCE for the current varStmt.
        // If varStmt is modified later in the inner loop (e.g., by removing all its decls),
        // this original `declarationsToProcess` list is what we iterate.
        const declarationsToProcess = varStmt.getDeclarations();
        for (const decl of declarationsToProcess) {
            // Check if the decl itself was removed (e.g. by a previous iteration on the same varStmt if it had multiple decls
            // and one was removed, potentially invalidating sibling decls if the parent structure changed significantly,
            // though `decl.remove()` is usually specific). More importantly, varStmt could have been removed.
            if (decl.wasForgotten() || varStmt.wasForgotten()) {
                if (filePath.includes('AFApplicationForm')) {
                    console.log(`Worker: [DEBUG] File: ${filePath} - decl ('${decl.getName()}') or its parent varStmt was forgotten. Skipping decl.`);
                }
                continue;
            }
            const initializer = decl.getInitializer();
            // ***** START DEBUG LOGGING for each variable declaration *****
            if (filePath.includes('AFApplicationForm')) {
                console.log(`Worker: [DEBUG] File: ${filePath} - Checking VarDecl: '${decl.getName()}' from VarStmt: '${varStmt.getText().split('\n')[0]}'`);
                if (initializer) {
                    console.log(`Worker: [DEBUG]   Initializer kind: ${initializer.getKindName()}, Initializer text: '${initializer.getText()}'`);
                    console.log(`Worker: [DEBUG]   Is Initializer an Identifier? ${ts_morph_1.Node.isIdentifier(initializer)}`);
                    if (ts_morph_1.Node.isIdentifier(initializer)) {
                        console.log(`Worker: [DEBUG]   Does Initializer text === componentsIdentifierName ('${componentsIdentifierName}')? ${initializer.getText() === componentsIdentifierName}`);
                    }
                }
                else {
                    console.log(`Worker: [DEBUG]   No initializer for this declaration.`);
                }
            }
            // ***** END DEBUG LOGGING *****
            if (initializer && ts_morph_1.Node.isIdentifier(initializer) && initializer.getText() === componentsIdentifierName) {
                const nameNode = decl.getNameNode();
                // ***** START DEBUG LOGGING for nameNode *****
                if (filePath.includes('AFApplicationForm')) {
                    console.log(`Worker: [DEBUG] File: ${filePath} - Matched initializer as Components. Checking nameNode.`);
                    console.log(`Worker: [DEBUG]   nameNode kind: ${nameNode.getKindName()}, nameNode text: '${nameNode.getText()}'`);
                    console.log(`Worker: [DEBUG]   Is nameNode an ObjectBindingPattern? ${ts_morph_1.Node.isObjectBindingPattern(nameNode)}`);
                }
                // ***** END DEBUG LOGGING *****
                if (ts_morph_1.Node.isObjectBindingPattern(nameNode)) {
                    // ***** START DEBUG LOGGING for entering destructuring block *****
                    if (filePath.includes('AFApplicationForm')) {
                        console.log(`Worker: [DEBUG] File: ${filePath} - Entered destructuring logic for an ObjectBindingPattern: ${nameNode.getText()}`);
                    }
                    // ***** END DEBUG LOGGING *****
                    const elementsInvolvedInReplacement = [];
                    for (const element of nameNode.getElements()) {
                        const propertyNameNode = element.getPropertyNameNode();
                        const localNameNode = element.getNameNode();
                        if (!ts_morph_1.Node.isIdentifier(localNameNode)) {
                            console.warn(`Worker: [WARN] Skipping complex binding element (non-identifier name part): ${element.getText()} in ${filePath}`);
                            continue;
                        }
                        const nameUsedForCacheLookup = propertyNameNode ? propertyNameNode.getText() : localNameNode.getText();
                        const localVariableName = localNameNode.getText();
                        // ***** START DEBUG LOGGING (original detailed block) *****
                        if (filePath.includes('AFApplicationForm')) {
                            console.log(`Worker: [DEBUG] File: ${filePath}`);
                            console.log(`Worker: [DEBUG] Destructuring element: '${element.getText()}'`);
                            console.log(`Worker: [DEBUG]   Name for cache lookup: '${nameUsedForCacheLookup}' (from ${propertyNameNode ? 'propertyNameNode' : 'localNameNode'})`);
                            console.log(`Worker: [DEBUG]   Local variable name: '${localVariableName}'`);
                            if (!componentLocationCache) {
                                console.log(`Worker: [DEBUG]   CRITICAL: componentLocationCache is null!`);
                            }
                            else {
                                const hasKey = componentLocationCache.has(nameUsedForCacheLookup);
                                console.log(`Worker: [DEBUG]   Cache has key '${nameUsedForCacheLookup}'? ${hasKey}`);
                                if (hasKey) {
                                    console.log(`Worker: [DEBUG]   Cache entry for '${nameUsedForCacheLookup}': ${JSON.stringify(componentLocationCache.get(nameUsedForCacheLookup))}`);
                                }
                                else {
                                    // If the key is not found, log a few nearby keys or a small sample of the cache to see if there are subtle differences
                                    let sampleKeys = Array.from(componentLocationCache.keys()).slice(0, 10);
                                    console.log(`Worker: [DEBUG]   Cache does NOT have key. Sample keys: ${sampleKeys.join(', ')}... Total cache size: ${componentLocationCache.size}`);
                                }
                            }
                        }
                        // ***** END DEBUG LOGGING *****
                        const cacheEntry = componentLocationCache.get(nameUsedForCacheLookup);
                        if (cacheEntry) {
                            if (filePath.includes('AFApplicationForm')) {
                                console.log(`Worker: [DEBUG]   SUCCESS: Cache entry found for '${nameUsedForCacheLookup}'. Proceeding with transformation.`);
                            }
                            elementsInvolvedInReplacement.push(element);
                            const componentDiskPath = cacheEntry.path;
                            if (!componentsToImport.has(componentDiskPath)) {
                                componentsToImport.set(componentDiskPath, { namedImports: new Map() });
                            }
                            const importInfo = componentsToImport.get(componentDiskPath);
                            if (cacheEntry.isDefault) {
                                importInfo.defaultImport = cacheEntry.exportName; // Name it as per registerComponent string
                                // If aliased: const { Alias: DefaultRegisteredName } = Components
                                // localVariableName = Alias, cacheEntry.exportName = DefaultRegisteredName
                                // We import `DefaultRegisteredName`, and usages of `Alias` must become `DefaultRegisteredName`
                                if (localVariableName !== cacheEntry.exportName) {
                                    console.log(`Worker: Aliasing default import in destructuring: ${cacheEntry.exportName} as ${localVariableName} in ${filePath}. Renaming usages.`);
                                    localNameNode.findReferencesAsNodes().forEach((refNode) => {
                                        if (ts_morph_1.Node.isIdentifier(refNode))
                                            refNode.replaceWithText(cacheEntry.exportName);
                                    });
                                }
                            }
                            else { // Named import
                                // cacheEntry.exportName is the actual exported name
                                // localVariableName is the name it should have locally
                                if (localVariableName !== cacheEntry.exportName) {
                                    importInfo.namedImports.set(cacheEntry.exportName, localVariableName); // import { exportName as localVariableName }
                                }
                                else {
                                    importInfo.namedImports.set(cacheEntry.exportName, undefined); // import { exportName }
                                }
                                // If original destructuring used aliasing: { RealExportName: Alias } = Components;
                                // propertyNameNode.getText() = RealExportName (==cacheEntry.exportName)
                                // localNameNode.getText() = Alias (==localVariableName)
                                // No renaming of usages needed here as the import alias handles it.
                            }
                        }
                        else {
                            // This path is taken if cacheEntry is null/undefined
                            if (filePath.includes('AFApplicationForm')) {
                                console.log(`Worker: [DEBUG]   FAILURE: No cache entry found for '${nameUsedForCacheLookup}'. Element will be kept.`);
                            }
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
                            if (!decl.wasForgotten())
                                decl.remove(); // Check before removing
                            if (!varStmt.wasForgotten() && varStmt.getDeclarations().length === 0) {
                                varStmt.remove();
                            }
                        }
                        else {
                            // Some elements were processed (are in elementsInvolvedInReplacement),
                            // others (not in elementsInvolvedInReplacement) should remain in the destructuring.
                            const elementsToKeep = nameNode.getElements().filter(element => !elementsInvolvedInReplacement.includes(element));
                            if (elementsToKeep.length > 0) {
                                if (!nameNode.wasForgotten()) { // Check nameNode before replacing
                                    const newBindingPatternText = `{ ${elementsToKeep.map(el => el.getText()).join(", ")} }`;
                                    nameNode.replaceWithText(newBindingPatternText);
                                }
                                else if (filePath.includes('AFApplicationForm')) {
                                    console.log(`Worker: [DEBUG] File: ${filePath} - nameNode was forgotten before replaceWithText for elementsToKeep.`);
                                }
                            }
                            else {
                                // This case means elementsToKeep is empty.
                                if (!decl.wasForgotten())
                                    decl.remove();
                                if (!varStmt.wasForgotten() && varStmt.getDeclarations().length === 0) {
                                    varStmt.remove();
                                }
                            }
                        }
                    }
                    // If elementsInvolvedInReplacement.length === 0, no changes needed for this destructuring declaration.
                }
            }
            // Check if varStmt was removed by operations on its declarations
            if (varStmt.wasForgotten()) {
                if (filePath.includes('AFApplicationForm')) {
                    console.log(`Worker: [DEBUG] File: ${filePath} - varStmt was forgotten after processing its declarations. Breaking from inner loop.`);
                }
                break; // varStmt is gone, no more declarations to process for it
            }
        }
    }
    // 3. Add new import declarations
    if (componentsToImport.size > 0) {
        for (const [componentDiskPath, importDetails] of componentsToImport) {
            const relativeImportPath = getRelativePath(sourceFile.getFilePath(), componentDiskPath);
            let existingImportDecl = sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === relativeImportPath);
            if (existingImportDecl) { // Modify existing import
                if (importDetails.defaultImport && !existingImportDecl.getDefaultImport()) {
                    existingImportDecl.setDefaultImport(importDetails.defaultImport);
                }
                const existingNamedImports = existingImportDecl.getNamedImports().map(ni => ({
                    name: ni.getNameNode().getText(),
                    alias: ni.getAliasNode()?.getText()
                }));
                const namedImportsToAdd = [];
                importDetails.namedImports.forEach((alias, name) => {
                    const alreadyPresent = existingNamedImports.some(eni => eni.name === name && eni.alias === alias);
                    if (!alreadyPresent) {
                        namedImportsToAdd.push({ name, alias });
                    }
                });
                if (namedImportsToAdd.length > 0)
                    existingImportDecl.addNamedImports(namedImportsToAdd);
            }
            else { // Add new import declaration
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
    // 4. Clean up `Components` import from `vulcan-lib/components`
    // We only attempt cleanup if we originally identified a 'Components' import (via componentsIdentifierName)
    // and actual modifications were made to the file.
    if (componentsIdentifierName && modified) {
        // Re-find the import declaration for 'Components' at this point, as previous operations
        // (node replacements, additions, or a future organizeImports) might have changed it.
        let currentComponentsImportDeclToClean;
        for (const importDecl of sourceFile.getImportDeclarations()) {
            if (importDecl.getModuleSpecifierValue().endsWith(vulcanLibImportPathSuffix)) {
                const componentsImportSpecifier = importDecl.getNamedImports().find(ni => (ni.getAliasNode()?.getText() || ni.getNameNode().getText()) === componentsIdentifierName);
                if (componentsImportSpecifier) {
                    currentComponentsImportDeclToClean = importDecl;
                    break; // Found it
                }
            }
        }
        if (currentComponentsImportDeclToClean) {
            let isStillUsed = false;
            sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.Identifier).forEach(id => {
                if (id.getText() === componentsIdentifierName) {
                    const parent = id.getParent();
                    if (ts_morph_1.Node.isPropertyAccessExpression(parent) && parent.getExpression() === id) {
                        if (!componentLocationCache.has(parent.getName())) {
                            isStillUsed = true;
                        }
                    }
                    else if (ts_morph_1.Node.isVariableDeclaration(parent) && parent.getInitializer() === id) {
                        const nameNode = parent.getNameNode();
                        if (ts_morph_1.Node.isObjectBindingPattern(nameNode)) {
                            if (nameNode.getElements().length > 0) { // If any elements remain in the destructuring
                                isStillUsed = true;
                            }
                        }
                        else { // e.g. const AllComponents = Components;
                            isStillUsed = true;
                        }
                    }
                }
            });
            if (!isStillUsed) {
                const componentsSpecifier = currentComponentsImportDeclToClean.getNamedImports()
                    .find(ni => (ni.getAliasNode()?.getText() || ni.getNameNode().getText()) === componentsIdentifierName);
                if (componentsSpecifier) {
                    componentsSpecifier.remove();
                    if (currentComponentsImportDeclToClean.getNamedImports().length === 0 &&
                        !currentComponentsImportDeclToClean.getDefaultImport() &&
                        !currentComponentsImportDeclToClean.getNamespaceImport()) {
                        currentComponentsImportDeclToClean.remove();
                    }
                }
            }
        }
    }
    if (modified) {
        // sourceFile.organizeImports(); // Call organizeImports ONCE here, after all modifications.
        await sourceFile.save();
        return { status: 'modified' };
    }
    else {
        return { status: 'no_changes_needed' };
    }
}
// Define the function that will process a batch of files
async function processComponentsBatch(batchFilePaths) {
    // Access tsConfigFilePath and allSourceFilePaths from workerData
    // Type assertion for workerData structure
    const { tsConfigFilePath, allSourceFilePaths } = worker_threads_1.workerData;
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
    const project = new ts_morph_1.Project();
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
        }
        catch (e) {
            console.error(`Worker: Error processing file ${filePath} in processComponentsBatch:`, e);
            results.push({ filePath, status: 'error', error: e.message || String(e) });
        }
    }
    return results;
}
// Start the worker using the utility from tsMorphWorker.ts
void (0, tsMorphWorker_1.startWorkerForBatch)(processComponentsBatch);
