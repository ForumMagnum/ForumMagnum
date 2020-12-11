import { Vulcan } from '../../lib/vulcan-lib';
import { generateFragmentTypes } from './generateFragmentTypes';
import { generateDbTypes } from './generateDbTypes';
import { generateViewTypes } from './generateViewTypes';
import fs from 'fs';


export function generateTypes(repoRoot?: string) {
  function writeFile(contents: string, path: string) {
    if (repoRoot) {
      fs.writeFileSync(repoRoot+path, contents);
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
    writeFile(generateFragmentTypes(), "/packages/lesswrong/lib/generated/fragmentTypes.d.ts");
    writeFile(generateDbTypes(), "/packages/lesswrong/lib/generated/databaseTypes.d.ts");
    writeFile(generateViewTypes(), "/packages/lesswrong/lib/generated/viewTypes.ts");
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

Vulcan.generateTypes = generateTypes;
