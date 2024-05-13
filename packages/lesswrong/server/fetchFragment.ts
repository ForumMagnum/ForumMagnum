import SelectFragmentQuery from "../lib/sql/SelectFragmentQuery";
import { getSqlClientOrThrow } from "../lib/sql/sqlClient";
import { accessFilterMultiple } from "../lib/utils/schemaUtils";
import { getCollection } from "./vulcan-lib";

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
}: {
  collectionName: CollectionName,
  fragmentName: FragmentName,
  currentUser: DbUser | null,
  selector?: string | MongoSelector<ObjectsByCollectionName[CollectionName]>,
  options?: MongoFindOneOptions<ObjectsByCollectionName[CollectionName]>,
  resolverArgs?: Record<string, unknown> | null,
}): Promise<FragmentTypes[FragmentName][]> => {
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
  const result = await db.any(sql, args);
  const collection = getCollection(collectionName);
  const filtered = await accessFilterMultiple(currentUser, collection, result, null);
  return filtered as unknown as FragmentTypes[FragmentName][];
}
