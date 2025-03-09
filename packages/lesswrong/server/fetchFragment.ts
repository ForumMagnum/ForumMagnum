import SelectFragmentQuery from "./sql/SelectFragmentQuery";
import { getSqlClientOrThrow } from "./sql/sqlClient";
import { accessFilterMultiple } from "../lib/utils/schemaUtils";
import { computeContextFromUser } from "./vulcan-lib/apollo-server/context";
import { getCollection } from "./collections/allCollections";
import { getSqlFragment } from "@/lib/vulcan-lib/fragments";

type FetchFragmentOptions<
  CollectionName extends CollectionNameString & keyof FragmentTypesByCollection,
  FragmentName extends FragmentTypesByCollection[CollectionName] & keyof FragmentTypes,
> = {
  /** The collection to fetch from. */
  collectionName: CollectionName,
  /** The fragment to use (which must be from the given collection). */
  fragmentName: FragmentName,
  /**
   * The current user, or null for logged out. For security reasons, this is not
   * an optional parameter - it must always be specified, even if you explicitely
   * assign `null`.
   */
  currentUser: DbUser | null,
  /** The mongo selector for the query, or `_id` as a string. */
  selector?: string | MongoSelector<ObjectsByCollectionName[CollectionName]>,
  /** The mongo options for the query */
  options?: MongoFindOptions<ObjectsByCollectionName[CollectionName]>,
  /** Arguments to pass to code resolvers and SQL resolvers */
  resolverArgs?: Record<string, unknown> | null,
  /** Optional resolver context */
  context?: ResolverContext,
  /**
   * By default, the results are passed through `accessFilterMultiple` to
   * restrict the data for the current user. If you need unrestricted data
   * you can set this to true. Note that the filter has negative performance
   * implications, so if you're in a context where security doesn't matter but
   * performance does (which is quite common for server-side processing
   * operations) then it's also sensible to set this to true.
   */
  skipFiltering?: boolean,
}

/**
 * The return type of `fetchFragment` always includes the _entire_ DbObject,
 * along with the requested resolver-only fields (this matched the behaviour of
 * `SqlFragment` which has to fetch the entire DbObject in order to correctly
 * generate fields that only have code resolvers).
 */
export type FetchedFragment<FragmentName extends keyof FragmentTypes> =
  ObjectsByCollectionName[CollectionNamesByFragmentName[FragmentName]] &
  FragmentTypes[FragmentName];

/**
 * `fetchFragment` can be used to fetch data from the database formatted as a
 * specific fragment, including resolver-only fields. Also see
 * `fetchFragmentSingle` if you only want a single result instead of an array.
 */
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
  context: maybeContext,
  skipFiltering,
}: FetchFragmentOptions<CollectionName, FragmentName>): Promise<FetchedFragment<FragmentName>[]> => {
  const context = maybeContext ?? await computeContextFromUser({
    user: currentUser,
    isSSR: false,
  });

  const sqlFragment = getSqlFragment(fragmentName);

  const query = new SelectFragmentQuery(
    sqlFragment,
    currentUser ?? null,
    resolverArgs,
    selector,
    undefined,
    options,
  );
  const {sql, args} = query.compile();
  const db = getSqlClientOrThrow();

  const results = await db.any(sql, args);
  await Promise.all(results.map(
    (result) => query.executeCodeResolvers(result, context),
  ));
  if (skipFiltering) {
    return results;
  }

  const filtered = await accessFilterMultiple(
    currentUser,
    collectionName,
    results,
    context ?? null,
  );
  return filtered as FetchedFragment<FragmentName>[];
}

/**
 * Like `fetchFragment`, but only returns a single result.
 */
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
