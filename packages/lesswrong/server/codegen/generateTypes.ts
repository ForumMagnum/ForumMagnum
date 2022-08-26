import { Vulcan } from '../../lib/vulcan-lib';
import { generateFragmentTypes } from './generateFragmentTypes';
import { generateQueryTypes } from './generateQueryTypes';
import { generateDbTypes } from './generateDbTypes';
import { generateViewTypes } from './generateViewTypes';
import fs from 'fs';


export function generateTypes(repoRoot?: string) {
  function writeIfChanged(contents: string, path: string) {
    if (repoRoot) {
      const absPath = repoRoot+path;
      let oldFileContents: string;
      try {
        oldFileContents = fs.readFileSync(absPath, 'utf-8');
      } catch(e) {
        // If file doesn't exist, treat it as empty
        oldFileContents = "";
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
    writeIfChanged(generateFragmentTypes(), "/packages/lesswrong/lib/generated/fragmentTypes.d.ts");
    writeIfChanged(generateQueryTypes(), "/packages/lesswrong/lib/generated/queryTypes.d.ts");
    writeIfChanged(generateDbTypes(), "/packages/lesswrong/lib/generated/databaseTypes.d.ts");
    writeIfChanged(generateViewTypes(), "/packages/lesswrong/lib/generated/viewTypes.ts");
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

Vulcan.generateTypes = generateTypes;
