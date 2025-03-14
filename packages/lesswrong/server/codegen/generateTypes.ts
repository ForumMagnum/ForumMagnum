import { generateFragmentTypes } from './generateFragmentTypes';
import { generateDbTypes } from './generateDbTypes';
import { generateViewTypes } from './generateViewTypes';
import { generateSQLSchema } from '../scripts/generateSQLSchema';
import fs from 'fs';
import path from 'path';
import { generateCollectionTypeNames } from './generateCollectionTypeNames';
import { generateDefaultFragments } from './generateDefaultFragments';

function enumerateFiles(dirPath: string): string[] {
  let fileList: string[] = [];

  // Read the contents of the directory
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // If it's a directory, recursively enumerate its contents
      fileList = fileList.concat(enumerateFiles(fullPath));
    } else if (entry.isFile()) {
      // If it's a file, add it to the list
      fileList.push(fullPath);
    }
    // Note: This ignores symlinks and other special types
  }

  return fileList;
}

const componentsDirs = [
  'packages/lesswrong/components', 'packages/lesswrong/lib/vendor/@material-ui'
];
function generateAllComponentsVite(): string {
  return `// Generated file - run "yarn generate" to update\n` +
    componentsDirs.flatMap(dir => enumerateFiles(dir))
      .filter(f => f.endsWith(".tsx") || f.endsWith(".jsx"))
      .map(f => {
        const content = fs.readFileSync(f, 'utf-8');
        const relativePath = path.relative('packages/lesswrong/lib/generated', f);
        
        if (shouldImportInAllComponents(content)) {
          return `import "${relativePath}"`;
        } else {
          return null;
        }
      })
      .filter(l => l !== null)
      .join("\n")
      + "\n\n";
}

function generateAllComponents(): string {
  const header = `// Generated file - run "yarn generate" to update
import { importComponent } from '../vulcan-lib/components';

`;

  return header +
    componentsDirs.flatMap(dir => enumerateFiles(dir))
      .filter(f => f.endsWith(".tsx") || f.endsWith(".jsx"))
      .map(f => {
        const relativePath = path.relative('packages/lesswrong/lib/generated', f);
        const content = fs.readFileSync(f, 'utf-8');
        if (!shouldImportInAllComponents(content)) {
          return null;
        }
        const components = extractComponentNames(content);
        
        const componentArg = components.length === 1 
          ? `"${components[0]}"` 
          : `[${components.map(c => `"${c}"`).join(', ')}]`;
        
        return `importComponent(${componentArg}, () => require("${relativePath}"));`;
      })
      .filter(line => line !== null)
      .join("\n")
      + "\n\n";
}

function shouldImportInAllComponents(content: string): boolean {
  const registerComponentRegex = /registerComponent\s*(<\s*\w*\s*>)?\s*\(\s*["'](\w+)["']/gm;
  if (registerComponentRegex.exec(content) !== null)
    return true;
  const defineStylesRegex = /defineStyles\s*\(/;
  if (defineStylesRegex.exec(content) !== null)
    return true;
  return false;
}

function extractComponentNames(content: string): string[] {
  const regex = /registerComponent\s*(<\s*\w*\s*>)?\s*\(\s*["'](\w+)["']/gm;
  const components: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    components.push(match[2]);
  }
  
  return components;
}

export function generateTypes(repoRoot?: string) {
  function writeIfChanged(contents: string, path: string) {
    if (repoRoot) {
      const absPath = repoRoot+path;
      let oldFileContents = "";
      try {
        oldFileContents = fs.readFileSync(absPath, 'utf-8');
      } catch {
        // eslint-disable-next-line no-console
        console.warn(`Updating file ${absPath} but it was not found`);
      }
      if (contents !== oldFileContents) {
        fs.writeFileSync(absPath, contents);
      }
    } else {
      // If repoRoot is not provided, it means we were invoked from meteor shell
      // for debugging, and we should output to console.log instead of to files
      // eslint-disable-next-line no-console
      console.log(`======== ${path} ========`);
      // eslint-disable-next-line no-console
      console.log(contents);
    }
  }
  
  try {
    writeIfChanged(generateDefaultFragments(), "/packages/lesswrong/lib/generated/defaultFragments.ts");
    writeIfChanged(generateFragmentTypes(), "/packages/lesswrong/lib/generated/fragmentTypes.d.ts");
    writeIfChanged(generateDbTypes(), "/packages/lesswrong/lib/generated/databaseTypes.d.ts");
    writeIfChanged(generateViewTypes(), "/packages/lesswrong/lib/generated/viewTypes.ts");
    writeIfChanged(generateCollectionTypeNames(), "/packages/lesswrong/lib/generated/collectionTypeNames.ts");
    writeIfChanged(generateAllComponentsVite(), "/packages/lesswrong/lib/generated/allComponentsVite.ts");
    writeIfChanged(generateAllComponents(), "/packages/lesswrong/lib/generated/allComponents.ts");
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

// After running this you still need to run:
//   yarn graphql-codegen --config codegen.yml
export const generateTypesAndSQLSchema = (rootDir?: string) => {
  generateSQLSchema(rootDir);
  generateTypes(rootDir);
}
