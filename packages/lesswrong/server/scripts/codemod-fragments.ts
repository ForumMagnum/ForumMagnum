// @ts-nocheck
/* eslint-disable no-console */


// This is a shogooth'd codemode for converting fragments. 
// It was originally run from the directory root, might not work from the script directory, I didn't check.

// File: codemod-fragments.mjs
import { Project, SyntaxKind, VariableDeclarationKind, SourceFile } from 'ts-morph';
import path from 'path';
import fs from 'fs/promises';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCodemod() {
    // 1. Initialize Project
    const project = new Project({
        tsConfigFilePath: 'tsconfig.json', // Assumes tsconfig.json is in the root
        skipAddingFilesFromTsConfig: true, // We'll add files manually via glob
    });

    const basePath = path.resolve(process.cwd()); // Use current working directory
    const targetPattern = 'packages/lesswrong/lib/collections/**/fragments.ts';
    console.log(`Searching for fragment files using pattern: ${targetPattern}`);
    console.log(`Base path: ${basePath}`);
    const allFragmentFilesPaths = await glob(targetPattern, { cwd: basePath, absolute: true, ignore: ['**/node_modules/**'] });
    console.log(`All fragment files paths: ${allFragmentFilesPaths}`);
    console.log(`Found ${allFragmentFilesPaths.length} fragment files.`);

    // Add all found files to the project context
    allFragmentFilesPaths.forEach(filePath => project.addSourceFileAtPath(filePath));

    // 2. Build Fragment Map
    console.log('\nBuilding fragment map...');
    const fragmentMap = new Map(); // Map<fragmentName, {filePath: string, exportName: string}>

    for (const sourceFile of project.getSourceFiles()) {
        const filePath = sourceFile.getFilePath();
        const relativePath = path.relative(basePath, filePath);
        console.log(`Scanning ${relativePath}...`);

        sourceFile.getVariableDeclarations().forEach(declaration => {
            if (declaration.isExported()) {
                const initializer = declaration.getInitializer();
                // Check if it's the () => frag`...` pattern
                if (initializer?.getKind() === SyntaxKind.ArrowFunction) {
                    const body = initializer.getBody();
                    if (body?.getKind() === SyntaxKind.TaggedTemplateExpression) {
                        const tag = body.getTag();
                        if (tag.getKind() === SyntaxKind.Identifier && tag.getText() === 'frag') {
                            const exportName = declaration.getName();
                            const templateNode = body.getTemplate();
                            let templateContent = '';
                            if (templateNode.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral) {
                                templateContent = templateNode.getLiteralText();
                            } else if (templateNode.getKind() === SyntaxKind.TemplateExpression) {
                                templateContent += templateNode.getHead().getLiteralText();
                                templateNode.getTemplateSpans().forEach(span => {
                                    templateContent += `\${${span.getExpression().getText()}}`; // Keep placeholders for now
                                    templateContent += span.getLiteral().getLiteralText();
                                });
                            }

                            // Extract fragment name (more robustly than simple regex)
                            const match = templateContent.match(/^\s*fragment\s+([A-Za-z0-9_]+)\s+on\s+/m);

                            if (match && match[1]) {
                                const fragmentName = match[1];
                                if (fragmentMap.has(fragmentName)) {
                                    const existing = fragmentMap.get(fragmentName);
                                    console.warn(`  WARNING: Duplicate GQL fragment name found: ${fragmentName}`);
                                    console.warn(`    Existing: export ${existing.exportName} in ${path.relative(basePath, existing.filePath)}`);
                                    console.warn(`    New:      export ${exportName} in ${relativePath}`);
                                    console.warn(`    Overwriting map entry with the new one. Please verify correctness.`);
                                }
                                fragmentMap.set(fragmentName, { filePath, exportName });
                                // console.log(`  Mapped GQL fragment ${fragmentName} (export: ${exportName}) to ${relativePath}`);
                            } else {
                                console.warn(`  WARNING: Could not extract GQL fragment name for export ${exportName} in ${relativePath}. Content:\n---\n${templateContent.substring(0, 100)}...\n---`);
                            }
                        }
                    }
                }
            }
        });
    }
    console.log(`Fragment map built with ${fragmentMap.size} entries.`);
    if (fragmentMap.size === 0) {
        console.error("Error: Fragment map is empty. No fragments found matching the '() => frag`...`' pattern. Exiting.");
        return;
    }

    // 3. Transform Files
    console.log('\nStarting transformation...');
    for (const sourceFile of project.getSourceFiles()) {
        const filePath = sourceFile.getFilePath();
        const relativePath = path.relative(basePath, filePath);
        console.log(`Processing ${relativePath}...`);
        let changed = false;
        let needsGqlImport = false;
        const dependenciesToAdd = new Map(); // Map<filePath, Set<exportName>>

        // Remove old frag import
        const fragImport = sourceFile.getImportDeclaration(imp => imp.getModuleSpecifierValue().includes('fragmentWrapper'));
        if (fragImport) {
            fragImport.remove();
            console.log('  Removed frag import.');
            changed = true;
        }

        // Find variable declarations using the frag pattern
        const declarationsToTransform = [];
        sourceFile.getVariableDeclarations().forEach(declaration => {
             if (declaration.isExported()) {
                const initializer = declaration.getInitializer();
                if (initializer?.getKind() === SyntaxKind.ArrowFunction) {
                    const body = initializer.getBody();
                    if (body?.getKind() === SyntaxKind.TaggedTemplateExpression) {
                        const tag = body.getTag();
                        if (tag.getKind() === SyntaxKind.Identifier && tag.getText() === 'frag') {
                            declarationsToTransform.push({ declaration, taggedTemplate: body });
                        }
                    }
                }
            }
        });

        if (declarationsToTransform.length === 0) {
             console.log('  No frag declarations found to transform.');
             // Save if only the import was removed
             if (changed) {
                 await sourceFile.save();
                 console.log(`  Saved changes (import removal) to ${relativePath}.`);
             }
             continue;
        }


        for (const { declaration, taggedTemplate } of declarationsToTransform) {
            const exportName = declaration.getName(); // e.g., PostsAuthors
            console.log(`  Transforming ${exportName}...`);
            needsGqlImport = true;
            changed = true;

            let bodyContent = ''; // The main part of the fragment, without embedded fragments
            const embeddedFragmentsInfo = []; // Stores { name: GQL name, exportName: TS export name }

            const template = taggedTemplate.getTemplate();

            if (template.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral) {
                bodyContent = template.getLiteralText();
            } else if (template.getKind() === SyntaxKind.TemplateExpression) {
                // console.log(`Template: ${template.getText()}`, template);
                bodyContent += template.getHead().getLiteralText();
                for (const span of template.getTemplateSpans()) {
                    const expr = span.getExpression();
                    const embeddedExportName = expr.getText(); // e.g., UsersMinimumInfo
                    bodyContent += `...${embeddedExportName}`;

                    // Find the actual GraphQL fragment name and definition file
                    let embeddedFragmentName = null;
                    let dependencyFound = false;
                    for (const [fragName, details] of fragmentMap.entries()) {
                        if (details.exportName === embeddedExportName) {
                            embeddedFragmentName = fragName;
                            const depInfo = details; // Already have details here

                            // Track dependency for import generation
                            if (depInfo.filePath !== filePath) { // Don't import from self
                                if (!dependenciesToAdd.has(depInfo.filePath)) {
                                    dependenciesToAdd.set(depInfo.filePath, new Set());
                                }
                                dependenciesToAdd.get(depInfo.filePath).add(embeddedExportName);
                            }
                            embeddedFragmentsInfo.push({ name: embeddedFragmentName, exportName: embeddedExportName });
                            dependencyFound = true;
                            break;
                        }
                    }

                    if (!dependencyFound) {
                         console.warn(`    WARN: Could not find definition for embedded fragment export '${embeddedExportName}' used in '${exportName}'. Assuming it's defined elsewhere or is an error.`);
                         // Add it anyway, assuming it might be globally available or defined in the same file *after* mapping
                         embeddedFragmentsInfo.push({ name: embeddedExportName, exportName: embeddedExportName });
                    }

                    // Append the literal part after the expression
                    bodyContent += span.getLiteral().getLiteralText();
                }
            } else {
                console.error(`  ERROR: Unexpected template kind for ${exportName}: ${template.getKindName()}`);
                continue; // Skip this fragment transformation
            }

            // Clean up body content (basic trim)
            bodyContent = bodyContent.trim();

            // Append embedded fragments GQL syntax (`...FragmentName`)
            // const embeddedString = embeddedFragmentsInfo.map(info => `  $\{${info.name}()}`).join('\n');

            // Construct the full gql tagged template literal string
            // Indent body content for readability
            const indentedBody = bodyContent.split('\n').join('\n');
            const newInitializer = `() => gql(\`\n  ${indentedBody}\n\`)`;

            // Replace the old arrow function initializer with the new gql literal
            declaration.set({ initializer: newInitializer });
            // Ensure it's declared as 'const'
            // declaration.setDeclarationKind(VariableDeclarationKind.Const);

            console.log(`    Replaced with gql literal, included ${embeddedFragmentsInfo.length} embedded fragments.`);
        }


        // Add gql import if needed
        if (needsGqlImport) {
            const existingGqlImport = sourceFile.getImportDeclaration('@/lib/generated/gql-codegen/gql');
            if (!existingGqlImport) {
                sourceFile.insertImportDeclaration(0, { // Insert at the top
                    moduleSpecifier: '@/lib/generated/gql-codegen/gql',
                    namedImports: ['gql']
                });
                console.log('  Added gql import.');
            } else {
                const namedImports = existingGqlImport.getNamedImports();
                if (!namedImports.some(ni => ni.getName() === 'gql')) {
                    existingGqlImport.addNamedImport('gql');
                    console.log('  Added gql to existing @/lib/generated/gql-codegen/gql import.');
                    changed = true; // Mark changed if import was modified
                }
            }
        }

        // Get rid of all unused imports

        // Find and remove unused imports
        const importDeclarations = sourceFile.getImportDeclarations();
        
        for (const importDecl of importDeclarations) {
            const namedImports = importDecl.getNamedImports();
            const moduleSpecifier = importDecl.getModuleSpecifierValue();
            
            // Check each named import to see if it's used in the file
            for (const namedImport of namedImports) {
                const importName = namedImport.getName();
                const references = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier)
                    .filter(id => id.getText() === importName && id.getParent().getKind() !== SyntaxKind.ImportSpecifier);
                
                // If no references found, remove this named import
                if (references.length === 0) {
                    console.log(`  Removing unused import: ${importName} from ${moduleSpecifier}`);
                    namedImport.remove();
                    changed = true;
                }
            }
            
            // If all named imports were removed, remove the entire import declaration
            if (importDecl.getNamedImports().length === 0 && !importDecl.getNamespaceImport() && !importDecl.getDefaultImport()) {
                console.log(`  Removing empty import declaration for: ${moduleSpecifier}`);
                importDecl.remove();
                changed = true;
            }
        }



        // // Add dependency imports
        // if (dependenciesToAdd.size > 0) {
        //     console.log('  Adding/updating dependency imports...');
        //     let importInsertIndex = sourceFile.getImportDeclarations().length; // Default to end
        //      if (needsGqlImport) importInsertIndex = 1; // Insert after gql import if added

        //     const sortedDependencies = Array.from(dependenciesToAdd.entries()).sort(([pathA], [pathB]) => pathA.localeCompare(pathB));


        //     for (const [sourcePath, exportNamesSet] of sortedDependencies) {
        //         const targetDir = path.dirname(filePath);
        //         let relativeImportPath = path.relative(targetDir, sourcePath);

        //         // On Windows, path.relative might use backslashes; ensure forward slashes for imports
        //         relativeImportPath = relativeImportPath.replace(/\\/g, '/');

        //         // Remove .ts extension
        //         relativeImportPath = relativeImportPath.replace(/\.ts$/, '');

        //         // Ensure relative path starts with ./ or ../ if it's in the same or parent dir
        //         if (!relativeImportPath.startsWith('.') && !relativeImportPath.startsWith('/')) {
        //              relativeImportPath = `./${relativeImportPath}`;
        //         }

        //         const exportNames = Array.from(exportNamesSet).sort(); // Sort for consistent order

        //         // Check if an import already exists for this path
        //         let existingImport = sourceFile.getImportDeclaration(imp => imp.getModuleSpecifierValue() === relativeImportPath);

        //         if (existingImport) {
        //             // Add missing named imports to existing declaration
        //             const existingNamedImports = new Set(existingImport.getNamedImports().map(ni => ni.getName()));
        //             const neededImports = exportNames.filter(name => !existingNamedImports.has(name));
        //             if (neededImports.length > 0) {
        //                 existingImport.addNamedImports(neededImports);
        //                 // Ensure imports are sorted within the declaration
        //                 existingImport.getNamedImports().sort((a, b) => a.getName().localeCompare(b.getName()));
        //                 console.log(`    Added ${neededImports.join(', ')} to existing import from ${relativeImportPath}`);
        //                 changed = true;
        //             }
        //         } else {
        //             // Add new import declaration
        //             sourceFile.insertImportDeclaration(importInsertIndex++, {
        //                 moduleSpecifier: relativeImportPath,
        //                 namedImports: exportNames // Already sorted
        //             });
        //             console.log(`    Added new import { ${exportNames.join(', ')} } from '${relativeImportPath}'`);
        //             changed = true;
        //         }
        //     }
        //      // Sort import declarations by module specifier (optional, for cleanliness)
        //     sourceFile.organizeImports();
        // }


        // Format the file content (optional but recommended)
        sourceFile.formatText({
             // Add any specific formatting options if needed, otherwise uses ts-morph defaults
             // indentSize: 2,
             // ensureNewLineAtEndOfFile: true,
        });

        // Save changes if any modifications were made
        if (changed) {
            await sourceFile.save();
            console.log(`  Saved changes to ${relativePath}.`);
        } else {
            console.log(`  No changes needed for ${relativePath}.`);
        }
    }

    console.log('\nCodemod finished.');
    console.log('Review the changes carefully, especially any WARN messages.');
    console.log('You might want to run your formatter (e.g., Prettier) over the changed files.');

}

runCodemod().catch(error => {
    console.error("Codemod script failed:", error);
    process.exit(1);
});
