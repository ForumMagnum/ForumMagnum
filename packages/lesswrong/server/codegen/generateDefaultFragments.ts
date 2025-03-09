import { collectionNameToTypeName } from "@/lib/generated/collectionTypeNames";
import { allSchemas } from "@/lib/schema/allSchemas";
import { augmentSchemas } from "../resolvers/allFieldAugmentations";

// Create default "dumb" gql fragment object for a given collection
function getDefaultFragmentText<N extends CollectionNameString>(
  collectionName: N,
  schema: SchemaType<N>,
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

    const isResolverField = field.resolveAs && !field.resolveAs.addOriginalField && field.resolveAs.type !== "ContentType";
    return !(isResolverField || fieldName.includes('$') || fieldName.includes('.') || (options.onlyViewable && !field.canRead));
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

export function generateDefaultFragments() {
  augmentSchemas();
  
  const sb: Array<string> = [];
  for (const [collectionName, schema] of Object.entries(allSchemas)) {
    const fragmentName = `${collectionName}DefaultFragment`;
    const fragment = getDefaultFragmentText(collectionName as CollectionNameString, schema);
    if (fragment) {
      sb.push(`export const ${fragmentName} = \`${fragment}\`;`);
    }
  }
  return sb.join('\n\n') + '\n';
}
