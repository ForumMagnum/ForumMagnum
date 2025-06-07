import SelectFragmentQuery from "./sql/SelectFragmentQuery";
import { getSqlClientOrThrow } from "./sql/sqlClient";
import { accessFilterMultiple } from "../lib/utils/schemaUtils";
import { computeContextFromUser } from "./vulcan-lib/apollo-server/context";
import { getSqlFragment } from "@/lib/fragments/allFragments";
import { TypedDocumentNode } from "@apollo/client";
import { FragmentDefinitionNode, print } from "graphql";
type FetchFragmentOptions<
  F,
  V,
  CollectionName extends CollectionNameString & keyof FragmentTypesByCollection,
> = {
  /** The collection to fetch from. */
  collectionName: CollectionName,
  /** The fragment to use (which must be from the given collection). */
  fragmentDoc: TypedDocumentNode<F, V>,
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
  /**
   * By default, we run all the relevant code resolvers for the chosen fragment.
   * Set this to true to avoid doing so.
   */
  skipCodeResolvers?: boolean,
}

/**
 * The return type of `fetchFragment` always includes the _entire_ DbObject,
 * along with the requested resolver-only fields (this matched the behaviour of
 * `SqlFragment` which has to fetch the entire DbObject in order to correctly
 * generate fields that only have code resolvers).
 */
export type FetchedFragment<F, CollectionName extends CollectionNameString> =
  ObjectsByCollectionName[CollectionName] &
  F;

/**
 * `fetchFragment` can be used to fetch data from the database formatted as a
 * specific fragment, including resolver-only fields. Also see
 * `fetchFragmentSingle` if you only want a single result instead of an array.
 */
export const fetchFragment = async <
  F,
  V,
  CollectionName extends CollectionNameString & keyof FragmentTypesByCollection,
>({
  collectionName,
  fragmentDoc,
  currentUser,
  selector,
  options,
  resolverArgs,
  context: maybeContext,
  skipFiltering,
  skipCodeResolvers,
}: FetchFragmentOptions<F, V, CollectionName>): Promise<FetchedFragment<F, CollectionName>[]> => {
  const context = maybeContext ?? await computeContextFromUser({
    user: currentUser,
    isSSR: false,
  });

  const fragmentText = print(fragmentDoc)
  const fragmentDefinition = fragmentDoc.definitions.find((def): def is FragmentDefinitionNode => def.kind === 'FragmentDefinition')
  if (!fragmentDefinition) {
    throw new Error('Fragment definition not found');
  }
  const fragmentName = fragmentDefinition.name.value;

  const sqlFragment = getSqlFragment(fragmentName, fragmentText);

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
  if (!skipCodeResolvers) {
    await Promise.all(results.map(
      (result) => query.executeCodeResolvers(result, context),
    ));
  }
  if (skipFiltering) {
    return results;
  }

  const filtered = await accessFilterMultiple(
    currentUser,
    collectionName,
    results,
    context ?? null,
  );
  return filtered as FetchedFragment<F, CollectionName>[];
}

/**
 * Like `fetchFragment`, but only returns a single result.
 */
export const fetchFragmentSingle = async <
  F,
  V,
  CollectionName extends CollectionNameString & keyof FragmentTypesByCollection,
>(
  options: FetchFragmentOptions<F, V, CollectionName>,
): Promise<FetchedFragment<F, CollectionName> | null> => {
  const results = await fetchFragment<F, V, CollectionName>({
    ...options,
    options: {
      ...options.options,
      limit: 1,
    },
  });
  return results[0] ?? null;
}
