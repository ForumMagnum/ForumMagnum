import { Vulcan } from '../../lib/vulcan-lib';
import { generateFragmentTypes } from './generateFragmentTypes';


export function generateTypes(repoRoot?: string) {
  function writeFile(contents: string, path: string) {
    if (repoRoot) {
      fs.writeFileSync(repoRoot+path, contents);
    } else {
      // If repoRoot is not provided, it means we were invoked from meteor shell
      // for debugging, and we should output to console.log instead of to files
      console.log(`======== ${path} ========`);
      console.log(contents);
    }
  }
  
  try {
    writeFile(generateFragmentTypes(), "/packages/lesswrong/lib/generated/fragmentTypes.d.ts");
  } catch(e) {
    console.error(e);
  }
}

Vulcan.generateTypes = generateTypes;
