import SelectFragmentQuery from "../lib/sql/SelectFragmentQuery";
import { getSqlClientOrThrow } from "../lib/sql/sqlClient";
import { accessFilterMultiple } from "../lib/utils/schemaUtils";
import { getCollection } from "./vulcan-lib";

type FetchFragmentOptions<
  FragmentName extends keyof FragmentTypes,
  CollectionName extends CollectionNameString = CollectionNamesByFragmentName[FragmentName]
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

export const fetchFragment = async <
  FragmentName extends keyof FragmentTypes,
  CollectionName extends CollectionNameString = CollectionNamesByFragmentName[FragmentName]
>({
  collectionName,
  fragmentName,
  currentUser,
  selector,
  options,
  resolverArgs,
  context,
  skipFiltering,
}: FetchFragmentOptions<FragmentName, CollectionName>): Promise<FragmentTypes[FragmentName][]> => {
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
  return filtered as unknown as FragmentTypes[FragmentName][];
}

export const fetchFragmentSingle = async <
  FragmentName extends keyof FragmentTypes,
  CollectionName extends CollectionNameString = CollectionNamesByFragmentName[FragmentName]
>(
  options: FetchFragmentOptions<FragmentName, CollectionName>,
): Promise<FragmentTypes[FragmentName] | null> => {
  const results = await fetchFragment({
    ...options,
    options: {
      ...options.options,
      limit: 1,
    },
  });
  return results[0] ?? null;
}
