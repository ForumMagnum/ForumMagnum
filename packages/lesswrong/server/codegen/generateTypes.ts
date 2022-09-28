import { Vulcan } from '../../lib/vulcan-lib';
import { getAllCollections } from '../../lib/vulcan-lib/getCollection';
import { generateFragmentTypes } from './generateFragmentTypes';
import { generateQueryTypes, graphqlSchemasToTS, getGraphqlSchemaFieldTypes, getResolverResultTypes } from './generateQueryTypes';
import { generateDbTypes } from './generateDbTypes';
import { generateViewTypes } from './generateViewTypes';
import { generateResolverTypes } from './generateResolverTypes';
import fs from 'fs';
import keyBy from 'lodash/keyBy';


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
    const context: TypeGenerationContext = {
      collections: keyBy(getAllCollections(), c=>c.collectionName),
      gqlSchemaFieldTypes: getGraphqlSchemaFieldTypes(),
      resolverResultTypes: getResolverResultTypes(),
    };
    
    writeIfChanged(graphqlSchemasToTS(context), "/packages/lesswrong/lib/generated/gqlTypes.d.ts");
    writeIfChanged(generateFragmentTypes(context), "/packages/lesswrong/lib/generated/fragmentTypes.d.ts");
    writeIfChanged(generateQueryTypes(context), "/packages/lesswrong/lib/generated/queryTypes.d.ts");
    writeIfChanged(generateDbTypes(context), "/packages/lesswrong/lib/generated/databaseTypes.d.ts");
    writeIfChanged(generateViewTypes(), "/packages/lesswrong/lib/generated/viewTypes.ts");
    writeIfChanged(generateResolverTypes(context), "/packages/lesswrong/lib/generated/resolverTypes.ts");
  } catch(e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

Vulcan.generateTypes = generateTypes;
