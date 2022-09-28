import { generatedFileHeader, graphqlTypeToTypescript, assert } from './typeGenerationUtils';
import { graphqlQueryPrototypeToNameAndReturnType } from './generateQueryTypes';
import { queries as gqlQueries } from '../../lib/vulcan-lib/graphql';
import { print as gqlPrint } from 'graphql';
import gql from 'graphql-tag';

export function generateResolverTypes(context: TypeGenerationContext): string {
  const sb: string[] = [];
  sb.push(generatedFileHeader);
  
  sb.push('interface ResolverArgumentTypes {\n');
  for (let {query,description} of gqlQueries) {
    const {name: queryName, returnTypeGql} = graphqlQueryPrototypeToNameAndReturnType(query);
    
    // Wrap the resolver specification in a gql "type" block so that it's parseable
    const parsed = gql(`type Query { ${query} }`);
    if (!(parsed?.definitions?.length >= 0))
      throw new Error("Parse not structured right");
    const parsedGqlDefinition = parsed.definitions[0];
    if (!parsedGqlDefinition)
      throw new Error("No definition");
    if (parsedGqlDefinition.kind !== "ObjectTypeDefinition")
      throw new Error("Parse not structured right");
    
    const definition = parsedGqlDefinition.fields?.[0];
    if (!definition)
      throw new Error("Parse not structured right");
    const tsArgumentsType = definition.arguments?.length
      ? `{ ${definition.arguments.map(arg => {
          const argName = arg.name.value;
          const gqlArgType = gqlPrint(arg.type);
          const tsArgType = graphqlTypeToTypescript(context, gqlArgType);
          return `${argName}: ${tsArgType}`;
        }).join(", ") } }`
      : 'void';
    sb.push(`  ${queryName}: ${tsArgumentsType}\n`);
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

