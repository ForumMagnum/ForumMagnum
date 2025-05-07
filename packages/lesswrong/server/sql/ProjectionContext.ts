import { RandIntCallback, randomId, seededRandInt } from "@/lib/random";
import { getSchema } from "@/lib/schema/allSchemas";
import isEqual from "lodash/isEqual";
import chunk from "lodash/chunk";
import type { GraphQLScalarType } from "graphql";
import { UsersCurrent } from "@/lib/generated/gql-codegen/graphql";

export type CustomResolver<N extends CollectionNameString = CollectionNameString> = {
  type: string | GraphQLScalarType,
  description?: string,
  fieldName?: string,
  addOriginalField?: boolean,
  arguments?: string|null,
  resolver: (root: ObjectsByCollectionName[N], args: any, context: ResolverContext) => any,
  sqlResolver?: SqlResolver<N>,
  /**
   * `sqlPostProcess` is run on the result of the database call, in addition
   * to the `sqlResolver`. It should return the value of this `field`, generally
   * by performing some operation on the value returned by the `sqlResolver`.
   * Most of the time this is an anti-pattern which should be avoided, but
   * sometimes it's unavoidable.
   */
  sqlPostProcess?: SqlPostProcess<N>,
};

export type CodeResolver<N extends CollectionNameString = CollectionNameString> =
  CustomResolver<N>["resolver"];

export interface CodeResolverMap extends Record<string, CodeResolver | CodeResolverMap> {}

export type PrefixGenerator = () => string;

/**
 * `ProjectionContext` contains the data for the projection of a specific query.
 * In general, this should not be created manually and should instead be
 * obtained by calling the `buildProjection` method of `SqlFragment`, which in
 * turn should generally be accessed through the more user-friendly
 * `SelectFragmentQuery`.
 */
class ProjectionContext<N extends CollectionNameString = CollectionNameString> {
  private randIntCallback: RandIntCallback;
  private resolverArgIndexes: Record<string, number> = {};
  private resolvers: Record<string, CustomResolver> = {};
  private projections: string[] = [];
  private joins: SqlJoinSpec[] = [];
  private args: unknown[] = [];
  private codeResolvers: CodeResolverMap = {};
  private primaryPrefix: string;
  private argOffset: number;
  private isAggregate: boolean;

  constructor(
    /**
     * The collection this projection is built on. This may or may not be the
     * collection that the _fragment_ is defined on depending on whether or not
     * this is an aggregate (see below).
     */
    private collection: CollectionBase<N>,
    /**
     * Fragments can be used recursively such that one contains another.
     * `ProjectionContext` corresponds to exactly _one_ fragment and contains
     * no recursion internally. If this `ProjectionContext` is the top level
     * context corresponding to the actual fragment the user requested then this
     * parameter will be undefined, otherwise if it's a sub-fragment this
     * parameter will contain the table prefix and SQL argument offset to use.
     * The sub-context can then be "absorbed" into the top-level context by
     * calling the `aggregate` method on the top-level context with the
     * sub-context as an argument.
     */
    aggregateDefinition?: {prefix: string, argOffset: number},
    /**
     * Generator for table prefixes - this is only configurable to make
     * testing easier and should generally be left undefined for real code.
     */
    private prefixGenerator?: PrefixGenerator,
  ) {
    const seed = collection.collectionName + (aggregateDefinition?.prefix ?? "");
    this.randIntCallback = seededRandInt(seed);

    if (aggregateDefinition) {
      this.primaryPrefix = aggregateDefinition.prefix;
      this.argOffset = aggregateDefinition.argOffset;
      this.isAggregate = true;
    } else {
      this.primaryPrefix = collection.getTable().getName()[0].toLowerCase();
      this.argOffset = 0;
      this.isAggregate = false;
    }

    const schema = this.getSchema();
    for (const fieldName in schema) {
      const field = schema[fieldName];
      if (field.graphql?.resolver) {
        const { outputType, resolver, sqlResolver, sqlPostProcess, arguments: resolverArgs } = field.graphql;
        const customResolver: CustomResolver<N> = {
          type: outputType,
          resolver,
          sqlResolver,
          sqlPostProcess,
          arguments: resolverArgs,
          fieldName,
        };

        this.resolvers[fieldName] = customResolver;
      }
    }
  }

  /**
   * If this is a top-level context then we name arguments using normal SQL
   * syntax `SELECT <expr1> "<name1>"`. If this is a sub-context then it will
   * be wrapped in a call to `JSONB_BUILD_OBJECT` which instead uses the syntax
   * `JSONB_BUILD_OBJECT('<name1>', <expr1>, '<name2>', <expr2>)`.
   */
  private namedExpression(name: string, expr: string): string {
    return this.isAggregate ? `'${name}', ${expr}` : `${expr} "${name}"`;
  }

  /**
   * Merge a sub-context into this context. See the doc comment for the
   * `aggregate` constructor parameter.
   */
  aggregate(subcontext: ProjectionContext, name: string) {
    const {primaryPrefix, projections, joins, args, codeResolvers} = subcontext;

    // Postgres functions take a maximum of 100 arguments. Each projection item
    // requires passing 2 arguments to `JSONB_BUILD_OBJECT`, so we need to split
    // it into chunks of 50 items then concatenate them together.
    const projChunks = chunk(projections, 50);
    const projObjs = projChunks.map(
      (chunk) => `JSONB_BUILD_OBJECT( ${chunk.join(", ")} )`,
    );
    const baseObj = `TO_JSONB("${primaryPrefix}".*)`;
    const obj = projObjs.length
      ? `${baseObj} || ${projObjs.join(" || ")}`
      : baseObj;

    const test = `"${primaryPrefix}"."_id"`;
    const proj = `CASE WHEN ${test} IS NULL THEN NULL ELSE (${obj}) END`;
    const namedProj = this.namedExpression(name, proj);
    this.projections.push(namedProj);
    this.joins = this.joins.concat(joins);
    this.args = this.args.concat(args);
    if (Object.keys(codeResolvers).length) {
      this.codeResolvers[name] = codeResolvers;
    }
  }

  getCollection() {
    return this.collection;
  }

  getSchema() {
    return getSchema<N>(this.collection.collectionName);
  }

  getResolver(name: string): CustomResolver | null {
    return this.resolvers[name] ?? null;
  }

  getTableName() {
    return `"${this.collection.getTable().getName()}"`;
  }

  getProjections() {
    return this.projections;
  }

  getJoins() {
    return this.joins;
  }

  getArgs() {
    return this.args;
  }

  getPrimaryPrefix() {
    return this.primaryPrefix;
  }

  getCodeResolvers() {
    return this.codeResolvers;
  }

  getPrefixGenerator() {
    return this.prefixGenerator;
  }

  getIsAggregate() {
    return this.isAggregate;
  }

  private prefixedAbsoluteField(
    prefix: string,
    name: string,
    jsonifyStarSelector = true,
  ) {
    let absoluteName: string = name;
    if (absoluteName !== "*") {
      absoluteName = `"${name}"`;
    }
    const absoluteField = `"${prefix}".${absoluteName}`;
    return name.indexOf("*") > -1 && jsonifyStarSelector
      ? `ROW_TO_JSON(${absoluteField})`
      : absoluteField;
  }

  absoluteField(name: string, jsonifyStarSelector = true) {
    return this.prefixedAbsoluteField(this.primaryPrefix, name, jsonifyStarSelector);
  }

  field(name: string, jsonifyStarSelector = true) {
    const absoluteField = this.absoluteField(name, jsonifyStarSelector);
    return this.isAggregate ? `'${name}', ${absoluteField}` : absoluteField;
  }

  currentUserField(name: string) {
    return `"currentUser"."${name}"`;
  }

  /**
   * This sets the current user. This method should be called exactly once
   * if this projection is _not_ an aggregate, and exactly never if this _is_
   * an aggregate. If we're in a logged-out context then this method should
   * still be called, but with a value of `null`.
   */
  setCurrentUser(currentUser: DbUser | UsersCurrent | null) {
    this.joins.push({
      table: "Users",
      type: "left",
      prefix: "currentUser",
      on: {
        _id: this.addArg(currentUser?._id ?? null),
      },
    });
  }

  addResolverArgs(resolverArgs: Record<string, unknown>) {
    const keys = Object.keys(resolverArgs);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (this.resolverArgIndexes[key] !== undefined) {
        throw new Error(`Duplicate resolver arg: "${key}"`);
      }
      const value = resolverArgs[key];
      this.resolverArgIndexes[key] = this.addArgInternal(value);
    }
  }

  addProjection(name: string, expression?: string, jsonifyStarSelector = true) {
    if (expression) {
      const normalizedExpr = expression.trim().replace(/\s+/g, " ");
      const namedExpr = this.namedExpression(name, normalizedExpr);
      this.projections.push(namedExpr);
    } else {
      this.projections.push(this.field(name, jsonifyStarSelector));
    }
  }

  addJoin<J extends CollectionNameString>({
    resolver,
    ...joinBase
  }: SqlResolverJoin<J> | SqlNonCollectionJoin) {
    const spec = this.getJoinSpec<J>(joinBase);
    const subField = (name: FieldName<J>) => `"${spec.prefix}"."${name}"`;
    return resolver(subField);
  }

  private addArgInternal(value: unknown) {
    this.args.push(value);
    return this.args.length + this.argOffset;
  }

  addArg(value: unknown) {
    return `$${this.addArgInternal(value)}`;
  }

  addCodeResolver(name: string, resolver: CodeResolver) {
    this.codeResolvers[name] = resolver;
  }

  getResolverArg(name: string): string {
    const index = this.resolverArgIndexes[name];
    return index ? `$${index}` : "NULL";
  }

  /**
   * Get the arguments to pass to `sqlResolver` functions defined in
   * collection schemas.
   */
  getSqlResolverArgs(): SqlResolverArgs<N> {
    return {
      field: this.absoluteField.bind(this),
      currentUserField: this.currentUserField.bind(this),
      join: this.addJoin.bind(this),
      arg: this.addArg.bind(this),
      resolverArg: this.getResolverArg.bind(this),
    };
  }

  private generateTablePrefix() {
    return this.prefixGenerator
      ? this.prefixGenerator()
      : randomId(5, this.randIntCallback);
  }

  private getJoinSpec<J extends CollectionNameString>({
    table,
    type,
    on,
  }: SqlJoinBase<J> | SqlNonCollectionJoinBase): SqlJoinSpec {
    for (const join of this.joins) {
      if (
        join.table === table &&
        join.type === type &&
        isEqual(join.on, on)
      ) {
        return join;
      }
    }
    const join: SqlJoinSpec = {
      table,
      type,
      // Cast is needed here as `SqlJoinBase` is partial and TS thinks we might
      // assign undefined to a string, but this is actually impossible
      on: on as Record<string, string>,
      prefix: this.generateTablePrefix(),
    };
    this.joins.push(join);
    return join;
  }

  private compileJoin({table, type = "inner", on, prefix}: SqlJoinSpec): string {
    const selectors: string[] = [];
    if (typeof on === "function") {
      selectors.push(on(this.prefixedAbsoluteField.bind(this, prefix)));
    } else {
      for (const field in on) {
        selectors.push(`"${prefix}"."${field}" = ${on[(field as keyof typeof on)]}`);
      }
    }
    const selector = selectors.join(" AND ");
    return `${type.toUpperCase()} JOIN "${table}" "${prefix}" ON ${selector}`;
  }

  compileQueryParts() {
    return {
      projection: this.projections.join(", "),
      table: this.getTableName(),
      prefix: this.primaryPrefix,
      joins: this.joins.map((join) => this.compileJoin(join)).join(" "),
      args: this.args,
    };
  }

  compileQuery(): {sql: string, args: unknown[]} {
    const {projection, table, prefix, joins, args} = this.compileQueryParts();
    return {
      sql: `SELECT ${projection} FROM ${table} "${prefix}" ${joins}`,
      args,
    };
  }
}

export default ProjectionContext;
