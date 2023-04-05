import { ensureIndex } from "./collectionIndexUtils";
import { addFieldsDict } from "./utils/schemaUtils";
import { TSVectorElement, TSVectorType } from "./sql/Type";
import PgCollection from "./sql/PgCollection";

export const SearchableCollections: CollectionBase<DbSearchableType>[] = [];

export type Formatter = (docName: string) => string;

export type SearchJoin<T extends DbObject> = {
  docName: string,
  join: Formatter,
  fields: Record<keyof T, string>,
}

export type SearchableOptions<T extends DbSearchableType> = {
  collection: CollectionBase<T>,
  indexableColumns: TSVectorElement[],
  headlineTitleSelector?: string,
  headlineBodySelector?: string,
  filter?: Formatter,
  fields: readonly (keyof T)[],
  syntheticFields?: Record<string, Formatter>,
  joins?: SearchJoin<DbObject>[],
}

type OptionsRecord = Record<CollectionNameString, SearchableOptions<DbSearchableType>>;

const searchableCollectionOptions: OptionsRecord = {} as OptionsRecord;

export const collectionIsSearchable = (
  collection: unknown,
): collection is PgCollection<DbSearchableType> =>
  collection instanceof PgCollection &&
    !!searchableCollectionOptions[collection.collectionName];

export const getSearchableCollectionOptions = <T extends DbSearchableType>(
  {collectionName}: PgCollection<T>,
): SearchableOptions<T> => searchableCollectionOptions[collectionName];

export const makeSearchable = <T extends DbSearchableType>(
  options: SearchableOptions<T>,
): void => {
  const {collection, indexableColumns} = options;
  SearchableCollections.push(collection);
  searchableCollectionOptions[collection.collectionName] =
    options as SearchableOptions<DbSearchableType>;

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
