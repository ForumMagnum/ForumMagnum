import SelectFragmentQuery from "../lib/sql/SelectFragmentQuery";
import { getSqlClientOrThrow } from "../lib/sql/sqlClient";
import { accessFilterMultiple } from "../lib/utils/schemaUtils";
import { getCollection } from "./vulcan-lib";

type FetchFragmentOptions<
  CollectionName extends CollectionNameString & keyof FragmentTypesByCollection,
  FragmentName extends FragmentTypesByCollection[CollectionName] & keyof FragmentTypes,
> = {
  collectionName: CollectionName,
  fragmentName: FragmentName,
  currentUser: DbUser | null,
  selector?: string | MongoSelector<ObjectsByCollectionName[CollectionName]>,
  options?: MongoFindOneOptions<ObjectsByCollectionName[CollectionName]>,
  resolverArgs?: Record<string, unknown> | null,
  context?: ResolverContext,
  skipFiltering?: boolean,
}

export type FetchedFragment<FragmentName extends keyof FragmentTypes> =
  ObjectsByCollectionName[CollectionNamesByFragmentName[FragmentName]] &
  FragmentTypes[FragmentName];

export const fetchFragment = async <
  CollectionName extends CollectionNameString & keyof FragmentTypesByCollection,
  FragmentName extends FragmentTypesByCollection[CollectionName] & keyof FragmentTypes,
>({
  collectionName,
  fragmentName,
  currentUser,
  selector,
  options,
  resolverArgs,
  context,
  skipFiltering,
}: FetchFragmentOptions<CollectionName, FragmentName>): Promise<FetchedFragment<FragmentName>[]> => {
  const query = new SelectFragmentQuery(
    fragmentName as FragmentName,
    currentUser ?? null,
    resolverArgs,
    selector,
    undefined,
    options,
  );
  const {sql, args} = query.compile();
  const db = getSqlClientOrThrow();
  const results = await db.any(sql, args);
  if (skipFiltering) {
    return results;
  }
  const filtered = await accessFilterMultiple(
    currentUser,
    getCollection(collectionName),
    results,
    context ?? null,
  );
  return filtered as FetchedFragment<FragmentName>[];
}

export const fetchFragmentSingle = async <
  CollectionName extends CollectionNameString & keyof FragmentTypesByCollection,
  FragmentName extends FragmentTypesByCollection[CollectionName] & keyof FragmentTypes,
>(
  options: FetchFragmentOptions<CollectionName, FragmentName>,
): Promise<FetchedFragment<FragmentName> | null> => {
  const results = await fetchFragment({
    ...options,
    options: {
      ...options.options,
      limit: 1,
    },
  });
  return results[0] ?? null;
}
