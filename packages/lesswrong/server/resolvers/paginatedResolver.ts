import { accessFilterMultiple } from "../../lib/utils/schemaUtils";
import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from "../../lib/vulcan-lib/graphql";
import { getCollectionByTypeName } from "../collections/allCollections";

/**
 * Checks if a graphql type passed in as a string literal is one of those that corresponds a collection's DbObject type
 * If so, return the corresponding DbObject type.  If not, return the manually specified type.
 */
type MaybeCollectionType<GraphQLType extends string, Fallback> =
  GraphQLType extends keyof ObjectsByTypeName
    ? ObjectsByTypeName[GraphQLType]
    : Fallback;

type PrimitiveGraphQLType = 'Int' | 'Float' | 'String' | 'Boolean' | 'Date' | 'JSON';
interface PrimitiveGraphQLTypeMap {
  Int: number;
  Float: number;
  String: string;
  Boolean: boolean;
  Date: Date;
  JSON: Json;
}

type NullableArraybleGraphQLType<T extends string = string> = T extends `[${infer U}]${infer Nullability}`
  ? Nullability extends '!' | ''
    ? Nullability extends '!'
      ? Array<NullableBaseGraphQLType<U>>
      : Array<NullableBaseGraphQLType<U>> | null
    : never
  : NullableBaseGraphQLType<T>;

type NullableBaseGraphQLType<T extends string> = T extends `${infer U}!`
  ? BaseGraphQLType<U>
  : BaseGraphQLType<T> | null;

type BaseGraphQLType<T extends string> = T extends PrimitiveGraphQLType
  ? PrimitiveGraphQLTypeMap[T]
  : MaybeCollectionType<T, unknown>;

type MappedGraphQLTypes<T extends Record<string, string>> = {
  [k in keyof T]: NullableArraybleGraphQLType<T[k]>;
};

/**
 * Create a paginated resolver for use on the frontend with `usePaginatedResolver`.
 * This enables having custom SQL queries with a `useMulti`-like interface.
 */
export const createPaginatedResolver = <
  FallbackReturnType,
  GraphQLType extends string,
  ReturnType extends MaybeCollectionType<GraphQLType, FallbackReturnType>,
  // TODO: if we ever update estrella/esbuild to something that supports TS 5.0+ features like const type modifiers,
  // stick a `const` in front of Args and that'll remove the need to add `as const` after the args when calling `createPaginatedResolver`
  Args extends Record<string, string>
>({
  name,
  graphQLType,
  args,
  callback,
  cacheMaxAgeMs = 0,
}: {
  /**
   * The name of the resolver - this should match `resolverName` in the call to
   * `usePaginatedResolver`
   */
  name: string,
  /**
   * The GraphQL type of the result (eg; "Comment"). Note that the result should
   * be an _array_ of this type.
   */
  graphQLType: GraphQLType,
  /**
   * Custom arguments, as a map from the argument names to the graphql types.
   */
  args?: Args,
  /**
   * The callback to fetch results, which will generally call into a repo (all
   * repos are available in `context.repos`).
   */
  callback: (
    context: ResolverContext,
    limit: number,
    args?: MappedGraphQLTypes<Args>,
  ) => Promise<ReturnType[]>,
  /**
   * Optional cache TTL in milliseconds - if undefined or 0 no cache is used.
   * Note that the cache is _global_ and not per-user.
   */
  cacheMaxAgeMs?: number,
}) => {
  let cachedAt = Date.now();
  let cached: ReturnType[] = [];

  // Try to get the collection for later permission checking if we're passed in a GraphQL type which would allow that
  let collection: CollectionBase<CollectionNameString> | undefined;
  try {
    collection = getCollectionByTypeName(graphQLType);
  } catch (err) {
    // Nothing to do anything in this case
    // We can't yet distinguish between getting passed a GraphQL type which is real but not a collection-derived type, and one that isn't real
  }

  addGraphQLResolvers({
    Query: {
      [name]: async (
        _: void,
        args: MappedGraphQLTypes<Args> & {limit: number},
        context: ResolverContext,
      ): Promise<{results: ReturnType[]}> => {
        const accessFilterFunction = collection
          ? (records: (ReturnType & DbObject)[]) => accessFilterMultiple(context.currentUser, collection!.collectionName, records as AnyBecauseHard[], context)
          : undefined;

        const limit = args.limit;
        if (
          cacheMaxAgeMs > 0 &&
          Date.now() - cachedAt < cacheMaxAgeMs &&
          cached.length >= limit
        ) {
          const filteredResults = await accessFilterFunction?.(cached as (ReturnType & DbObject)[]) ?? cached;
          return {results: filteredResults.slice(0, limit) as ReturnType[]};
        }
        const results = await callback(context, limit, args);
        cachedAt = Date.now();
        if (cacheMaxAgeMs) {
          cached = results;
        }
        const filteredResults = await accessFilterFunction?.(results as (ReturnType & DbObject)[]) ?? results;
        return {results: filteredResults as ReturnType[]};
      },
    },
  });

  addGraphQLSchema(`
    type ${name}Result {
      results: [${graphQLType}!]!
    }
  `);

  const allArgs = {...args, limit: "Int"};
  const argString = Object
    .keys(allArgs)
    .map((arg) => `${arg}: ${allArgs[arg as keyof typeof allArgs]}`)
    .join(", ");
  addGraphQLQuery(`${name}(${argString}): ${name}Result`);
}
