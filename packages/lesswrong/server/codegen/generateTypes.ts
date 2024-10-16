import { Vulcan } from '../../lib/vulcan-lib';
import { generateFragmentTypes } from './generateFragmentTypes';
import { generateDbTypes } from './generateDbTypes';
import { generateViewTypes } from './generateViewTypes';
import { generateSQLSchema } from '../scripts/generateSQLSchema';
import fs from 'fs';

export function generateTypes(repoRoot?: string) {
  function writeIfChanged(contents: string, path: string) {
    if (repoRoot) {
      const absPath = repoRoot+path;
      const oldFileContents = fs.readFileSync(absPath, 'utf-8');
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
    writeIfChanged(generateFragmentTypes(), "/packages/lesswrong/lib/generated/fragmentTypes.d.ts");
    writeIfChanged(generateDbTypes(), "/packages/lesswrong/lib/generated/databaseTypes.d.ts");
    writeIfChanged(generateViewTypes(), "/packages/lesswrong/lib/generated/viewTypes.ts");
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

// After running this you still need to run:
//   yarn graphql-codegen --config codegen.yml
const generateTypesAndSQLSchema = (rootDir?: string) => {
  generateSQLSchema(rootDir);
  generateTypes(rootDir);
}

Vulcan.generateTypes = generateTypes;
Vulcan.generateTypesAndSQLSchema = generateTypesAndSQLSchema;
