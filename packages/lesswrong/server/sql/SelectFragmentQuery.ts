import SelectQuery from "./SelectQuery";
import type ProjectionContext from "./ProjectionContext";
import type { CodeResolverMap, PrefixGenerator } from "./ProjectionContext";
import type { ParsedSqlFragment } from "./SqlFragment";

/**
 * Sort keys that name a schema field with a SQL resolver, rather than a column
 * or a synthetic field, sort by the resolver's expression. Calling the resolver
 * adds its joins to `projection`, whether or not the fragment selects the
 * field. This deliberately ignores `enableCustomSqlResolvers`, which only
 * exists to keep expensive resolver expressions out of projections.
 */
function getSqlResolverSortExpressions<N extends CollectionNameString>(
  projection: ProjectionContext<N>,
  syntheticFieldNames: string[],
  sort?: MongoSort<ObjectsByCollectionName[N]>,
): Map<string, string> {
  const table = projection.getCollection().getTable();
  const schema = projection.getSchema();
  const sqlResolverArgs = projection.getSqlResolverArgs();
  const unresolvedSortKeys = Object.keys(sort ?? {}).filter(
    (key) => !table.getField(key) && !syntheticFieldNames.includes(key),
  );
  return new Map(unresolvedSortKeys.flatMap((key): [string, string][] => {
    const sqlResolver = schema[key]?.graphql?.sqlResolver;
    return sqlResolver ? [[key, sqlResolver(sqlResolverArgs)]] : [];
  }));
}

/**
 * `SelectFragmentQuery` is the main external interface for running select
 * queries that make use of custom SQL resolvers (which allow arbitrary joins).
 * This is used, for instance, by `default_resolvers.ts`.
 *
 * The object(s) returned by the compiled SQL will contain all of the fields of
 * the `DbX` type, plus all of the schema fields that define a SQL resolver and
 * are present in the specified fragment.
 *
 * A field with a SQL resolver that returns no value (for instance, if it uses
 * a LEFT JOIN and no matching object is found) can be distinguished from a
 * field with no SQL resolver as the former will be `null` and the latter will
 * be `undefined`.
 */
class SelectFragmentQuery<
  N extends CollectionNameString = CollectionNameString
> extends SelectQuery<ObjectsByCollectionName[N]> {
  private projectionArgs: unknown[];
  private codeResolvers: CodeResolverMap = {};

  constructor(
    /** The SQL fragment to use */
    private sqlFragment: ParsedSqlFragment,
    /** The current user, of null if logged out */
    currentUser: DbUser | null,
    /** Dictionary of arguments to pass to custom resolvers */
    private resolverArgs?: Record<string, unknown> | null,
    /** An optional mongo-style selector to build a WHERE clause */
    selector?: string | MongoSelector<ObjectsByCollectionName[N]>,
    /**
     * Synthetic fields to add to the projection (see docs for `addFields`
     * in `SelectQuery`). This only exists for legacy reasons and you should
     * strongly prefer adding SQL resolvers to the schema instead of adding
     * synthetic fields here.
     */
    syntheticFields?: Partial<Record<keyof ObjectsByCollectionName[N], MongoSelector<ObjectsByCollectionName[N]>>>,
    /** Option to pass to the underlying `SelectQuery` */
    options?: MongoFindOptions<ObjectsByCollectionName[N]>,
    /**
     * Generator for table prefixes. This argument mainly exists to facilitate
     * unit tests and the default value should generally be used for real-world
     * queries.
     */
    prefixGenerator?: PrefixGenerator,
  ) {
    const projection = sqlFragment.buildProjection<N>(
      currentUser,
      resolverArgs,
      prefixGenerator,
    );
    const table = projection.getCollection().getTable();
    super(table, selector, options, {
      deferInit: true,
      primaryPrefix: projection.getPrimaryPrefix(),
    });

    const {addFields} = this.disambiguateSyntheticFields(syntheticFields, {});
    const syntheticProjection = addFields
      ? this.getSyntheticFields(addFields)
      : [];

    const sortExpressions = getSqlResolverSortExpressions(
      projection,
      Object.keys(addFields ?? {}),
      options?.sort,
    );

    const {
      projection: projectionSql,
      table: tableSql,
      prefix,
      joins,
      args,
    } = projection.compileQueryParts();
    this.atoms.push("SELECT");
    this.atoms.push(projectionSql);
    this.atoms = this.atoms.concat(syntheticProjection);
    this.atoms.push("FROM");
    this.atoms.push(tableSql);
    this.atoms.push(`"${prefix}"`);
    this.atoms.push(joins);
    this.projectionArgs = args;

    this.initSelector(selector, options, {sortExpressions});
    this.codeResolvers = projection.getCodeResolvers();
  }

  private getCommentLine() {
    if (this.sqlComment) {
      return `-- ${this.sqlComment} (fragment ${this.sqlFragment.name})\n`;
    } else {
      return `-- Fragment ${this.sqlFragment.name}\n`;
    }
  }

  compile() {
    const {sql, args} = super.compile(this.projectionArgs.length);
    return {
      sql: this.getCommentLine() + sql,
      args: [...this.projectionArgs, ...args],
    };
  }

  /**
   * Defining a SQL resolver is _optional_ when defining a custom resolver.
   * Custom resolver fields that only have a "code resolver" and no SQL
   * resolver can be populated by calling this function on the result returned
   * from the database.
   *
   * Note that it is not necessary to call this function if the result will be
   * passed to the front-end via GraphQL as Apollo will fill in the missing
   * fields for us automatically (see `getFields` in `initGraphQL.ts`).
   */
  async executeCodeResolvers<T extends DbObject>(
    obj: T | null,
    context: ResolverContext,
    resolvers = this.codeResolvers,
  ): Promise<T | null> {
    if (!obj) {
      return null;
    }

    const promises: Promise<unknown>[] = [];
    const subresolvers: Record<string, CodeResolverMap> = {};

    for (const resolverName in resolvers) {
      const resolver = resolvers[resolverName];
      if (typeof resolver === "function") {
        const generator = async () => {
          const result = await resolver(
            obj as AnyBecauseTodo,
            this.resolverArgs ?? {},
            context,
          );
          obj[resolverName as keyof T] = result;
        }
        promises.push(generator());
      } else {
        subresolvers[resolverName] = resolver;
      }
    }

    for (const subresolverName in subresolvers) {
      obj[subresolverName as keyof T] ??= {} as T[keyof T];
      promises.push(this.executeCodeResolvers(
        obj[subresolverName as keyof T] as DbObject,
        context,
        subresolvers[subresolverName],
      ));
    }

    await Promise.all(promises);

    return obj;
  }
}

export default SelectFragmentQuery;
