import { allSchemas } from "@/lib/schema/allSchemas";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { resolvers, typeDefs } from "../vulcan-lib/apollo-server/initGraphQL";
import type { GraphQLSchema } from "graphql";
import { collectionNameToTypeName } from "@/lib/generated/collectionTypeNames";

function getBaseGraphqlType(graphqlSpec?: GraphQLFieldSpecification<any>) {
  if (!graphqlSpec?.outputType || typeof graphqlSpec.outputType !== 'string') {
    return;
  }

  return graphqlSpec.outputType.replace(/[![\]]+/g, "");
}

function getGraphqlTypeSubfields(baseGraphqlType: string, executableSchema: GraphQLSchema): string[] {
  const type = executableSchema.getType(baseGraphqlType);
  if (!type?.astNode) {
    return [];
  }

  switch (type.astNode.kind) {
    case 'ObjectTypeDefinition':
    case 'InputObjectTypeDefinition':
    case 'InterfaceTypeDefinition':
      return type.astNode.fields?.map(f => f.name.value) ?? [];
    default:
      return [];
  }
}

// Create default "dumb" gql fragment object for a given collection
function getDefaultFragmentText<N extends CollectionNameString>(
  collectionName: N,
  schema: Record<string, CollectionFieldSpecification<any>>,
  collectionToTypeNameMap: Record<string, string>,
  executableSchema: GraphQLSchema,
  options = { onlyViewable: true },
): string|null {
  const fieldNames = Object.keys(schema).filter((fieldName: string) => {
    /*

    Exclude a field from the default fragment if
    1. it has a resolver and addOriginalField is false
    2. it has $ in its name
    3. it's not viewable (if onlyViewable option is true)

    */
    const field: CollectionFieldSpecification<N> = schema[fieldName];
    // OpenCRUD backwards compatibility

    const { database, graphql } = field;

    const isResolverOnlyField = !database;
    const isMakeEditableField = graphql && 'editableFieldOptions' in graphql;
    const noReadPermissions = !graphql?.canRead.length;
    const graphqlType = getBaseGraphqlType(graphql);
    const subfields = graphqlType ? getGraphqlTypeSubfields(graphqlType, executableSchema) : [];
    const hasSubfields = subfields.length > 0;

    return !(isResolverOnlyField || isMakeEditableField || (options.onlyViewable && noReadPermissions) || hasSubfields);
  });

  const typeName = collectionToTypeNameMap[collectionName];

  if (fieldNames.length) {
    const fragmentText = `
  fragment ${collectionName}DefaultFragment on ${typeName} {
${fieldNames.map(fieldName => {
  return `    ${fieldName}\n`;
}).join('')}  }
`;

    return fragmentText;
  } else {
    return null;
  }
};

export function generateDefaultFragments(collectionToTypeNameMap: Record<string, string>): string[] {
  const executableSchema = makeExecutableSchema({ typeDefs, resolvers });
  const fragments: string[] = [];
  for (const [collectionName, schema] of Object.entries(allSchemas)) {
    const typeName = collectionToTypeNameMap[collectionName];
    if (!executableSchema.getType(typeName)) {
      continue;
    }

    const fragment = getDefaultFragmentText(collectionName as CollectionNameString, schema, collectionToTypeNameMap, executableSchema);
    if (fragment) {
      fragments.push(fragment);
    }
  }
  return fragments
}

export function generateDefaultFragmentsFile(collectionToTypeNameMap: Record<string, string>): string {
  const executableSchema = makeExecutableSchema({ typeDefs, resolvers });
  const sb: string[] = [`import { gql } from "@/lib/crud/wrapGql";`];
  for (const [collectionName, schema] of Object.entries(allSchemas)) {
    const typeName = collectionToTypeNameMap[collectionName];
    if (!executableSchema.getType(typeName)) {
      continue;
    }
    
    const fragmentName = `${collectionName}DefaultFragment`;
    const fragment = getDefaultFragmentText(collectionName as CollectionNameString, schema, collectionToTypeNameMap, executableSchema);
    if (fragment) {
      sb.push(`export const ${fragmentName} = gql(\`${fragment}\`);`);
    }
  }
  return sb.join('\n\n') + '\n';
}
