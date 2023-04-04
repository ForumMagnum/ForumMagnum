import { ensureIndex } from "./collectionIndexUtils";
import { TSVectorElement, TSVectorType } from "./sql/Type";
import { addFieldsDict } from "./utils/schemaUtils";

export const SearchableCollections: CollectionBase<DbSearchableType>[] = [];

export const collectionIsSearchable = (collectionName: CollectionNameString) => {
  const name = collectionName.toLowerCase();
  return SearchableCollections.some(
    ({collectionName}) => collectionName.toLowerCase() === name,
  );
}

export const makeSearchable = <T extends DbSearchableType>({
  collection,
  indexableColumns,
}: {
  collection: CollectionBase<T>,
  indexableColumns: TSVectorElement[],
}): void => {
  SearchableCollections.push(collection);

  addFieldsDict(collection, {
    searchVector: {
      type: Object,
      blackbox: true,
      getPostgresType: () => new TSVectorType(indexableColumns),
      optional: true,
      hidden: true,
      canRead: [],
      canUpdate: [],
      canCreate: [],
    },
  });

  ensureIndex(collection, {searchVector: 1}, {postgresType: "gin"});
}
