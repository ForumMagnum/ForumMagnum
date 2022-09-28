import { generatedFileHeader, graphqlTypeToTypescript } from './typeGenerationUtils';
import { graphqlQueryPrototypeToNameAndReturnType } from './generateQueryTypes';
import { queries as gqlQueries } from '../../lib/vulcan-lib/graphql';


export function generateResolverTypes(context: TypeGenerationContext): string {
  const sb: string[] = [];
  sb.push(generatedFileHeader);
  
  sb.push('interface ResolverArgumentTypes {\n');
  for (let {query,description} of gqlQueries) {
    const {name: queryName, returnTypeGql} = graphqlQueryPrototypeToNameAndReturnType(query);
    sb.push(`  ${queryName}: any\n`); // TODO
  }
  sb.push('}\n');
  
  sb.push('interface ResolverResultTypes {\n');
  for (let {query,description} of gqlQueries) {
    const {name: queryName, returnTypeGql} = graphqlQueryPrototypeToNameAndReturnType(query);
    const returnTypeTS = graphqlTypeToTypescript(context, returnTypeGql);
    sb.push(`  ${queryName}: ${returnTypeTS}\n`);
  }
  sb.push('}\n');
  
  const resolverNames = gqlQueries.map(({query,description}) =>
    graphqlQueryPrototypeToNameAndReturnType(query).name
  );
  sb.push(`type ResolverName = ${resolverNames.map(n=>wrapWithQuotes(n)).join("|")}\n`);
  
  return sb.join('');
}

function wrapWithQuotes(s: string) {
  return `"${s.replace(/"/g,'\\"')}"`;
}

