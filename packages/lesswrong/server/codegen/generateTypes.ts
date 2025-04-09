import { generateFragmentTypes, generateFragmentsGqlFile } from './generateFragmentTypes';
import { generateDbTypes } from './generateDbTypes';
import { generateViewTypes } from './generateViewTypes';
import { generateSQLSchema } from '../scripts/generateSQLSchema';
import fs from 'fs';
import path from 'path';
import { generateCollectionTypeNames } from './generateCollectionTypeNames';
import { generateInputTypes } from './generateInputTypes';
import { generateDefaultFragmentsFile } from './generateDefaultFragments';
import { typeDefs } from '../vulcan-lib/apollo-server/initGraphQL';
import { print } from 'graphql';

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

function generateAllComponentsVite(): string {
  return `// Generated file - run "yarn generate" to update\n` +
    enumerateFiles("packages/lesswrong/components")
      .filter(f => f.endsWith(".tsx"))
      .map(f => {
        const relativePath = f.replace('packages/lesswrong/components/', '../../components/');
        return `import "${relativePath}"`;
      })
      .join("\n")
      + "\n\n";
}

function generateAllComponents(): string {
  const componentsDir = "packages/lesswrong/components";
  const header = `// Generated file - run "yarn generate" to update
import { importComponent } from '../vulcan-lib/components';

`;

  return header + enumerateFiles(componentsDir)
    .filter(f => f.endsWith(".tsx"))
    .map(f => {
      const relativePath = f.replace('packages/lesswrong/components/', '../../components/');
      const content = fs.readFileSync(f, 'utf-8');
      const components = extractComponentNames(content);
      
      if (components.length === 0) return null;
      
      const componentArg = components.length === 1 
        ? `"${components[0]}"` 
        : `[${components.map(c => `"${c}"`).join(', ')}]`;
      
      return `importComponent(${componentArg}, () => require("${relativePath}"));`;
    })
    .filter(line => line !== null)
    .join("\n")
    + "\n\n";
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
    writeIfChanged(generateDefaultFragmentsFile(), "/packages/lesswrong/lib/generated/defaultFragments.ts");
    writeIfChanged(generateInputTypes(), "/packages/lesswrong/lib/generated/inputTypes.d.ts");
    writeIfChanged(generateFragmentTypes(), "/packages/lesswrong/lib/generated/fragmentTypes.d.ts");
    writeIfChanged(generateFragmentsGqlFile(), "/packages/lesswrong/lib/generated/fragments.gql");
    writeIfChanged(generateDbTypes(), "/packages/lesswrong/lib/generated/databaseTypes.d.ts");
    writeIfChanged(generateViewTypes(), "/packages/lesswrong/lib/generated/viewTypes.ts");
    writeIfChanged(generateCollectionTypeNames(), "/packages/lesswrong/lib/generated/collectionTypeNames.ts");
    writeIfChanged(generateAllComponentsVite(), "/packages/lesswrong/lib/generated/allComponentsVite.ts");
    writeIfChanged(generateAllComponents(), "/packages/lesswrong/lib/generated/allComponents.ts");
    writeIfChanged(generateGraphQLSchemaFile(), "/packages/lesswrong/lib/generated/gqlSchema.gql");
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

function generateGraphQLSchemaFile(): string {
  const sb: string[] = [];
  sb.push("# Generated file - run 'yarn generate' to update.\n\n");
  sb.push(print(typeDefs));
  return sb.join("");
}
