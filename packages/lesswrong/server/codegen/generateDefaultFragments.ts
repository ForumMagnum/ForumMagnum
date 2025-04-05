import { collectionNameToTypeName } from "@/lib/generated/collectionTypeNames";
import { allSchemas } from "@/lib/schema/allSchemas";

// Create default "dumb" gql fragment object for a given collection
function getDefaultFragmentText<N extends CollectionNameString>(
  collectionName: N,
  schema: Record<string, NewCollectionFieldSpecification<any>>,
  options = { onlyViewable: true },
): string|null {
  const fieldNames = Object.keys(schema).filter((fieldName: string) => {
    /*

    Exclude a field from the default fragment if
    1. it has a resolver and addOriginalField is false
    2. it has $ in its name
    3. it's not viewable (if onlyViewable option is true)

    */
    const field: NewCollectionFieldSpecification<N> = schema[fieldName];
    // OpenCRUD backwards compatibility

    const { database, graphql } = field;

    const isResolverOnlyField = !database;
    const isMakeEditableField = graphql && 'editableFieldOptions' in graphql;
    const noReadPermissions = !graphql?.canRead.length;

    return !(isResolverOnlyField || isMakeEditableField || (options.onlyViewable && noReadPermissions));
  });

  if (fieldNames.length) {
    const fragmentText = `
  fragment ${collectionName}DefaultFragment on ${collectionNameToTypeName[collectionName]} {
${fieldNames.map(fieldName => {
  return `    ${fieldName}\n`;
}).join('')}  }
`;

    return fragmentText;
  } else {
    return null;
  }
};

export function generateDefaultFragments(): string[] {
  const fragments: string[] = [];
  for (const [collectionName, schema] of Object.entries(allSchemas)) {
    const fragment = getDefaultFragmentText(collectionName as CollectionNameString, schema);
    if (fragment) {
      fragments.push(fragment);
    }
  }
  return fragments
}

export function generateDefaultFragmentsFile(): string {
  const sb: string[] = [];
  for (const [collectionName, schema] of Object.entries(allSchemas)) {
    const fragmentName = `${collectionName}DefaultFragment`;
    const fragment = getDefaultFragmentText(collectionName as CollectionNameString, schema);
    if (fragment) {
      sb.push(`export const ${fragmentName} = \`${fragment}\`;`);
    }
  }
  return sb.join('\n\n') + '\n';
}
