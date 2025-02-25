import path from "path";
import * as os from "os";
import { ImportDeclaration, Project, SourceFile } from "ts-morph";
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";

// -------------------------------------------------------------------------------
// CONFIGURATION
// -------------------------------------------------------------------------------

const TS_CONFIG_FILE = path.join(__dirname, "tsconfig.json");
const NUM_WORKERS = Math.max(1, os.cpus().length);

// -------------------------------------------------------------------------------
// CACHES (Shared in the main thread for building the re-export map)
// -------------------------------------------------------------------------------

/**
 * Cache for (containingFile + moduleSpecifier) -> SourceFile|null
 * so that multiple export/import declarations referencing the same module
 * won't keep calling getModuleSpecifierSourceFile().
 *
 * Note that each worker thread has its own memory space, so this only helps
 * within a single run on the main thread. To truly reuse across runs,
 * you'd need to serialize/deserialize it.  This example simply shows how
 * to skip the entire run if files haven't changed.
 */
const moduleResolutionCache = new Map<string, SourceFile | null>();

// -------------------------------------------------------------------------------
// MAIN ENTRY POINT (runs on the main thread)
// -------------------------------------------------------------------------------

if (isMainThread && !process.env.TESTING) {
  (async () => {
    console.log(`[${new Date().toISOString()}] Starting barrel-busting...`);

    const startTime = Date.now();
    const project = new Project({
      tsConfigFilePath: TS_CONFIG_FILE,
      skipAddingFilesFromTsConfig: false,
    });

    const totalFiles = project.getSourceFiles().length;
    console.log(`[${new Date().toISOString()}] Found ${totalFiles} files to process`);
    console.log("Building export/re-export map...");

    const { reExportMap, localExportMap } = buildReExportMap(project);

    // 3. Spawn workers to rewrite the imports in parallel
    const sourceFiles = project.getSourceFiles();
    const chunkSize = Math.ceil(sourceFiles.length / NUM_WORKERS);
    let processedFiles = 0;
    const logInterval = 100; // Log every X files
    const workerPromises: Promise<void>[] = [];

    for (let i = 0; i < NUM_WORKERS; i++) {
      const start = i * chunkSize;
      const end = start + chunkSize;
      const fileChunk = sourceFiles.slice(start, end).map((sf) => sf.getFilePath());

      if (fileChunk.length === 0) break;
      console.log(`Spawning worker ${i} to handle ${fileChunk.length} files.`);

      workerPromises.push(
        new Promise<void>((resolve, reject) => {
          const worker = new Worker(__filename, {
            workerData: {
              filePaths: fileChunk,
              reExportMap,
              localExportMap,
              tsConfigFilePath: TS_CONFIG_FILE,
            },
            execArgv: [
              "-r",
              "ts-node/register",
              "-r",
              "tsconfig-paths/register",
            ],
            env: {
              ...process.env,
              TS_NODE_TRANSPILE_ONLY: "true",
            },
          });

          worker.on("message", (msg) => {
            if (msg === "done") {
              resolve();
            } else if (typeof msg === "object" && msg.type === "progress") {
              processedFiles += 1;
              if (processedFiles % logInterval === 0) {
                const percent = ((processedFiles / totalFiles) * 100).toFixed(1);
                console.log(
                  `[${new Date().toISOString()}] Processed ${processedFiles}/${totalFiles} files (${percent}%)`
                );
              }
            }
          });

          worker.on("error", reject);
          worker.on("exit", (code) => {
            if (code !== 0) {
              reject(new Error(`Worker stopped with exit code ${code}`));
            }
          });
        })
      );
    }

    await Promise.all(workerPromises);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `[${new Date().toISOString()}] All workers done rewriting imports. Total time: ${duration}s`
    );
    console.log("Barrel-busting complete.");
  })().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else if (!process.env.TESTING) {
  // -------------------------------------------------------------------------------
  // WORKER THREAD CODE
  // -------------------------------------------------------------------------------

  const { filePaths, reExportMap, localExportMap, tsConfigFilePath } = workerData as {
    filePaths: string[];
    reExportMap: Record<string, { originalFile: string; originalName: string }>;
    localExportMap: Record<string, Set<string>>;
    tsConfigFilePath: string;
  };

  const workerProject = new Project({
    tsConfigFilePath,
    skipAddingFilesFromTsConfig: true,
  });

  for (const fp of filePaths) {
    workerProject.addSourceFileAtPath(fp);
  }

  // Rewrite each file's imports
  for (const sf of workerProject.getSourceFiles()) {
    rewriteImports(sf, reExportMap, localExportMap);
    if (parentPort) {
      parentPort.postMessage({ type: "progress" });
    }
  }

  // Save all changed source files
  workerProject.saveSync();
  if (parentPort) {
    parentPort.postMessage("done");
  }
}

// -------------------------------------------------------------------------------
// BUILD RE-EXPORT MAP
// -------------------------------------------------------------------------------
export function buildReExportMap(project: Project) {
  /**
   * reExportMap[filePath::symbolName] = { originalFile, originalName }
   * localExportMap[filePath] = Set<symbolName> declared in that file
   */
  const reExportMap: Record<string, { originalFile: string; originalName: string }> = {};
  const localExportMap: Record<string, Set<string>> = {};

  // We'll also keep a cache so repeated findOriginalExport calls
  // for the same file+symbol won't cause extra recursion.
  const findOriginalExportCache = new Map<string, { finalFile: string; finalName: string }>();

  // 1) Initialize localExportMap with direct exports
  for (const sourceFile of project.getSourceFiles()) {
    const sfPath = sourceFile.getFilePath();
    localExportMap[sfPath] = new Set<string>();

    sourceFile.getExportedDeclarations().forEach((_decls, name) => {
      localExportMap[sfPath].add(name);
    });
  }

  // 2) Identify re-export statements and link them to final origins
  for (const sourceFile of project.getSourceFiles()) {
    const sfPath = sourceFile.getFilePath();

    for (const exportDec of sourceFile.getExportDeclarations()) {
      const moduleSpecifier = exportDec.getModuleSpecifierValue();
      if (!moduleSpecifier) continue;

      const resolvedSourceFile = getModuleSpecifierSourceFileCached(exportDec);
      if (!resolvedSourceFile) {
        // Could be 3rd party or unresolved
        continue;
      }

      const isThirdParty = /node_modules/.test(resolvedSourceFile.getFilePath());
      if (isThirdParty) {
        continue;
      }

      if (exportDec.isNamespaceExport()) {
        // e.g. "export * from './foo'"
        const targetFileExports = resolvedSourceFile.getExportedDeclarations();
        targetFileExports.forEach((_decls, symbolName) => {
          const { finalFile, finalName } = findOriginalExportCached(resolvedSourceFile, symbolName);
          reExportMap[`${sfPath}::${symbolName}`] = {
            originalFile: finalFile,
            originalName: finalName,
          };

          // If we previously marked that symbol as local, remove it
          if (localExportMap[sfPath].has(symbolName)) {
            localExportMap[sfPath].delete(symbolName);
          }
        });
      } else {
        // e.g. "export { A, B as C } from './foo'"
        for (const spec of exportDec.getNamedExports()) {
          const name = spec.getName();
          const alias = spec.getAliasNode()?.getText() || name;

          const { finalFile, finalName } = findOriginalExportCached(resolvedSourceFile, name);
          reExportMap[`${sfPath}::${alias}`] = {
            originalFile: finalFile,
            originalName: finalName,
          };

          // If we previously marked that alias as local, remove it
          if (localExportMap[sfPath].has(alias)) {
            localExportMap[sfPath].delete(alias);
          }
        }
      }
    }
  }

  return { reExportMap, localExportMap };

  // Cache-aware version of findOriginalExport
  function findOriginalExportCached(file: SourceFile, symbolName: string) {
    const cacheKey = file.getFilePath() + "::" + symbolName;
    if (findOriginalExportCache.has(cacheKey)) {
      return findOriginalExportCache.get(cacheKey)!;
    }
    const result = findOriginalExport(file, symbolName);
    findOriginalExportCache.set(cacheKey, result);
    return result;
  }

  function findOriginalExport(
    file: SourceFile,
    symbolName: string
  ): { finalFile: string; finalName: string } {
    const filePath = file.getFilePath();
    if (localExportMap[filePath].has(symbolName)) {
      return { finalFile: filePath, finalName: symbolName };
    }
    const key = `${filePath}::${symbolName}`;
    if (reExportMap[key]) {
      const { originalFile, originalName } = reExportMap[key];
      if (originalFile === filePath && originalName === symbolName) {
        // Avoid infinite recursion
        return { finalFile: filePath, finalName: symbolName };
      }
      const nextFile = project.getSourceFileOrThrow(originalFile);
      return findOriginalExportCached(nextFile, originalName);
    }
    return { finalFile: filePath, finalName: symbolName };
  }
}

// -------------------------------------------------------------------------------
// HELPER: Cached resolution of module specifiers
// -------------------------------------------------------------------------------
function getModuleSpecifierSourceFileCached(dec: {
  getModuleSpecifierValue: () => string | undefined;
  getSourceFile: () => SourceFile;
  getModuleSpecifierSourceFile: () => SourceFile | undefined;
}): SourceFile | null {
  const containingFile = dec.getSourceFile().getFilePath();
  const moduleSpecifier = dec.getModuleSpecifierValue();
  if (!moduleSpecifier) return null;

  const cacheKey = `${containingFile}::${moduleSpecifier}`;
  if (moduleResolutionCache.has(cacheKey)) {
    return moduleResolutionCache.get(cacheKey) || null;
  }

  const resolved = dec.getModuleSpecifierSourceFile();
  moduleResolutionCache.set(cacheKey, resolved || null);
  return resolved || null;
}

// -------------------------------------------------------------------------------
// REWRITE IMPORTS IN A SINGLE SOURCE FILE
// -------------------------------------------------------------------------------
export function rewriteImports(
  sourceFile: SourceFile,
  reExportMap: Record<string, { originalFile: string; originalName: string }>,
  localExportMap: Record<string, Set<string>>
) {
  const importsToProcess = new Set<ImportDeclaration>();
  
  // Helper to resolve the full path of a module specifier
  function resolveFullPath(importDec: ImportDeclaration): string | null {
    const resolvedSourceFile = getModuleSpecifierSourceFileCached(importDec);
    return resolvedSourceFile?.getFilePath() || null;
  }
  
  // First pass - identify all imports that need processing and group by resolved path
  const importsByResolvedPath = new Map<string, ImportDeclaration[]>();
  
  for (const importDec of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDec.getModuleSpecifierValue();
    if (!moduleSpecifier.startsWith(".") && !moduleSpecifier.startsWith("@")) {
      continue;
    }

    const resolvedSourceFile = getModuleSpecifierSourceFileCached(importDec);
    if (!resolvedSourceFile) continue;

    const barrelPath = resolvedSourceFile.getFilePath();
    if (/node_modules/.test(barrelPath)) continue;

    const namedImports = importDec.getNamedImports();
    if (namedImports.length === 0) continue;

    // Group by resolved path
    const fullPath = resolveFullPath(importDec);
    if (fullPath) {
      if (!importsByResolvedPath.has(fullPath)) {
        importsByResolvedPath.set(fullPath, []);
      }
      importsByResolvedPath.get(fullPath)!.push(importDec);
    }

    // Check if any named imports need rewriting
    for (const spec of namedImports) {
      const symbolName = spec.getName();
      if (!localExportMap[barrelPath]?.has(symbolName)) {
        const key = `${barrelPath}::${symbolName}`;
        if (reExportMap[key]) {
          importsToProcess.add(importDec);
          break;
        }
      }
    }
  }

  // If we have multiple imports for the same resolved path, add them all for processing
  for (const [_, imports] of importsByResolvedPath) {
    if (imports.length > 1) {
      imports.forEach(imp => importsToProcess.add(imp));
    }
  }

  // Process each import that needs changes
  for (const importDec of importsToProcess) {
    const moduleSpecifier = importDec.getModuleSpecifierValue();
    const resolvedSourceFile = getModuleSpecifierSourceFileCached(importDec)!;
    const barrelPath = resolvedSourceFile.getFilePath();
    
    const namedImports = importDec.getNamedImports();
    const importsByFile = new Map<string, Array<{ name: string; alias?: string }>>();
    const keptImports: Array<{ name: string; alias?: string }> = [];

    // Sort imports by their target file
    for (const spec of namedImports) {
      const symbolName = spec.getName();
      const aliasNode = spec.getAliasNode();
      const alias = aliasNode ? aliasNode.getText() : undefined;

      if (localExportMap[barrelPath]?.has(symbolName)) {
        keptImports.push({ name: symbolName, alias });
      } else {
        const key = `${barrelPath}::${symbolName}`;
        const remap = reExportMap[key];
        if (remap) {
          if (!importsByFile.has(remap.originalFile)) {
            importsByFile.set(remap.originalFile, []);
          }
          importsByFile.get(remap.originalFile)!.push({
            name: remap.originalName === "default" ? "default" : remap.originalName,
            alias: alias || (remap.originalName === "default" ? symbolName : undefined)
          });
        } else {
          keptImports.push({ name: symbolName, alias });
        }
      }
    }

    // If we have exactly one target file and no kept imports, modify in place
    if (importsByFile.size === 1 && keptImports.length === 0) {
      const [newFile, newImports] = Array.from(importsByFile.entries())[0];
      const newModuleSpecifier = getModuleSpecifier(moduleSpecifier, newFile, sourceFile);
      
      importDec.setModuleSpecifier(newModuleSpecifier);
      importDec.removeNamedImports();
      importDec.addNamedImports(newImports.sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      // Otherwise, remove this import and add new ones
      importDec.remove();
      
      // Add kept imports if any
      if (keptImports.length > 0) {
        sourceFile.addImportDeclaration({
          moduleSpecifier,
          namedImports: keptImports.sort((a, b) => a.name.localeCompare(b.name))
        });
      }

      // Add new imports for each target file
      for (const [newFile, newImports] of importsByFile) {
        sourceFile.addImportDeclaration({
          moduleSpecifier: getModuleSpecifier(moduleSpecifier, newFile, sourceFile),
          namedImports: newImports.sort((a, b) => a.name.localeCompare(b.name))
        });
      }
    }
  }

  // Finally, unify any duplicate imports
  unifyImportsInFile(sourceFile);
}

// -------------------------------------------------------------------------------
// COLLAPSE MULTIPLE IMPORTS FOR THE SAME MODULE INTO ONE
// -------------------------------------------------------------------------------
function unifyImportsInFile(sourceFile: SourceFile) {
  const importDeclarations = sourceFile.getImportDeclarations();

  // Group by resolved path instead of specifier string
  const importsByResolvedPath = new Map<
    string,
    { typeImports: ImportDeclaration[]; regularImports: ImportDeclaration[] }
  >();

  for (const dec of importDeclarations) {
    const specifier = dec.getModuleSpecifierValue();
    // Skip non-relative or external imports that don't use @ alias
    if (!specifier.startsWith(".") && !specifier.startsWith("@")) {
      continue;
    }

    // Get the fully resolved path
    const resolvedSourceFile = getModuleSpecifierSourceFileCached(dec);
    if (!resolvedSourceFile) continue;
    const resolvedPath = resolvedSourceFile.getFilePath();

    if (!importsByResolvedPath.has(resolvedPath)) {
      importsByResolvedPath.set(resolvedPath, { typeImports: [], regularImports: [] });
    }
    const group = importsByResolvedPath.get(resolvedPath)!;
    if (dec.isTypeOnly()) {
      group.typeImports.push(dec);
    } else {
      group.regularImports.push(dec);
    }
  }

  // Unify imports that resolve to the same file
  for (const [resolvedPath, { typeImports, regularImports }] of importsByResolvedPath) {
    // Prefer @ alias if any import uses it
    const allImports = [...typeImports, ...regularImports];
    const aliasImport = allImports.find(imp => imp.getModuleSpecifierValue().startsWith('@/'));
    const preferredSpecifier = aliasImport 
      ? aliasImport.getModuleSpecifierValue()
      : allImports[0].getModuleSpecifierValue();

    if (typeImports.length > 1) {
      const entry = collectImportInfo(typeImports);
      typeImports.forEach((d) => d.remove());

      sourceFile.addImportDeclaration({
        moduleSpecifier: preferredSpecifier,
        defaultImport: entry.defaultName,
        namespaceImport: entry.namespaceImport,
        namedImports: Array.from(entry.namedImports)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({ name, alias }) => ({ name, alias })),
        isTypeOnly: true,
      });
    }

    if (regularImports.length > 1) {
      const entry = collectImportInfo(regularImports);
      regularImports.forEach((d) => d.remove());

      sourceFile.addImportDeclaration({
        moduleSpecifier: preferredSpecifier,
        defaultImport: entry.defaultName,
        namespaceImport: entry.namespaceImport,
        namedImports: Array.from(entry.namedImports)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(({ name, alias }) => ({ name, alias })),
        isTypeOnly: false,
      });
    }
  }
}

function collectImportInfo(declarations: ImportDeclaration[]) {
  const entry = {
    defaultName: undefined as string | undefined,
    namedImports: new Set<{ name: string; alias?: string }>(),
    namespaceImport: undefined as string | undefined,
  };

  for (const dec of declarations) {
    // Handle default imports
    const defaultImport = dec.getDefaultImport();
    if (defaultImport) {
      const defaultText = defaultImport.getText();
      if (!entry.defaultName) {
        entry.defaultName = defaultText;
      } else if (defaultText !== "default") {
        // If this is an aliased default import, add it as a named import
        entry.namedImports.add({ name: "default", alias: defaultText });
      }
    }

    // Handle namespace imports
    const ns = dec.getNamespaceImport()?.getText();
    if (ns && !entry.namespaceImport) {
      entry.namespaceImport = ns;
    }

    // Handle named imports
    const named = dec.getNamedImports().map((ni) => ({
      name: ni.getName(),
      alias: ni.getAliasNode()?.getText(),
    }));
    named.forEach((ni) => entry.namedImports.add(ni));
  }

  return entry;
}

function addNamedImportsToMap(
  mapObj: Record<string, Set<{ name: string; alias?: string }>>,
  filePath: string,
  imports: Array<{ name: string; alias?: string }>
) {
  if (!mapObj[filePath]) {
    mapObj[filePath] = new Set();
  }
  for (const imp of imports) {
    mapObj[filePath].add(imp);
  }
}

function getModuleSpecifier(originalSpec: string, newFilePath: string, sourceFile: SourceFile): string {
  // If original import used @ alias
  if (originalSpec.startsWith('@/')) {
    const projectRoot = sourceFile.getProject().getFileSystem().getCurrentDirectory();
    const newPathRelativeToProject = path.relative(projectRoot, newFilePath);
    
    // If the new path is within the same directory structure as the alias
    if (newPathRelativeToProject.startsWith('packages/lesswrong/')) {
      // Convert to alias format by removing the packages/lesswrong/ prefix
      return '@/' + newPathRelativeToProject.replace('packages/lesswrong/', '');
    }
  }
  return sourceFile.getRelativePathAsModuleSpecifierTo(newFilePath);
}