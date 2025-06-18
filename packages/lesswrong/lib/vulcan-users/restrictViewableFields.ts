import { userGetGroups, userHasFieldPermissions } from './permissions';

// For a given document or list of documents, keep only fields viewable by current user
// @param {Object} user - The user performing the action
// @param {Object} collection - The collection
// @param {Object} document - The document being returned by the resolver
// TODO: Integrate permissions-filtered DbObjects into the type system
export async function restrictViewableFields<N extends CollectionNameString>(
  user: DbUser | null,
  collectionName: N,
  docOrDocs: ObjectsByCollectionName[N] | undefined | null
): Promise<Partial<ObjectsByCollectionName[N]>>;
export async function restrictViewableFields<N extends CollectionNameString>(
  user: DbUser | null,
  collectionName: N,
  docOrDocs: ObjectsByCollectionName[N][] | undefined | null
): Promise<Partial<ObjectsByCollectionName[N]>[]>;
export async function restrictViewableFields<N extends CollectionNameString>(
  user: DbUser | null,
  collectionName: N,
  docOrDocs?: ObjectsByCollectionName[N][] | undefined | null
): Promise<Partial<ObjectsByCollectionName[N]> | Partial<ObjectsByCollectionName[N]>[]> {
  if (Array.isArray(docOrDocs)) {
    return restrictViewableFieldsMultiple(user, collectionName, docOrDocs);
  } else {
    return restrictViewableFieldsSingle(user, collectionName, docOrDocs);
  }
}
;

export const restrictViewableFieldsMultiple = async function <N extends CollectionNameString, DocType extends ObjectsByCollectionName[N]>(
  user: DbUser | null,
  collectionName: N,
  docs: DocType[]
): Promise<Partial<DocType>[]> {
  if (!docs) return [];
  return Promise.all(docs.map(doc => restrictViewableFieldsSingle(user, collectionName, doc)));
};

export const restrictViewableFieldsSingle = async function <N extends CollectionNameString, DocType extends ObjectsByCollectionName[N]>(
  user: DbUser | null,
  collectionName: N,
  doc: DocType | undefined | null
): Promise<Partial<DocType>> {
  if (!doc) return {};
  // This is dynamically imported for bundle-splitting reasons, though it's not yet clear whether it actually helps
  const { getSchema } = await import('../schema/allSchemas');
  const schema = getSchema(collectionName);
  const restrictedDocument: Partial<DocType> = {};
  const userGroups = userGetGroups(user);

  for (const fieldName in doc) {
    const fieldSchema = schema[fieldName];
    if (fieldSchema) {
      const canRead = fieldSchema.graphql?.canRead;
      if (canRead && userHasFieldPermissions(user, userGroups, canRead, doc)) {
        restrictedDocument[fieldName] = doc[fieldName];
      }
    }
  }

  return restrictedDocument;
};
