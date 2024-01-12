import isEqual from "lodash/isEqual";
import { RandIntCallback, randomId, seededRandInt } from "../random";
import chunk from "lodash/chunk";

export type CustomResolver<N extends CollectionNameString = CollectionNameString> =
  NonNullable<CollectionFieldSpecification<N>["resolveAs"]>;

export type CodeResolver<N extends CollectionNameString = CollectionNameString> =
  CustomResolver<N>["resolver"];

export interface CodeResolverMap extends Record<string, CodeResolver | CodeResolverMap> {}

export type PrefixGenerator = () => string;

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
    private collection: CollectionBase<N>,
    aggregate?: {prefix: string, argOffset: number},
    private prefixGenerator?: PrefixGenerator,
  ) {
    const seed = collection.collectionName + (aggregate?.prefix ?? "");
    this.randIntCallback = seededRandInt(seed);

    if (aggregate) {
      this.primaryPrefix = aggregate.prefix;
      this.argOffset = aggregate.argOffset;
      this.isAggregate = true;
    } else {
      this.primaryPrefix = collection.getTable().getName()[0].toLowerCase();
      this.argOffset = 0;
      this.isAggregate = false;
    }

    const schema = this.getSchema();
    for (const fieldName in schema) {
      const field = schema[fieldName];
      if (field.resolveAs) {
        const resolverName = field.resolveAs.fieldName ?? fieldName;
        this.resolvers[resolverName] = field.resolveAs;
      }
    }
  }

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
    const namedProj = subcontext.isAggregate
      ? `'${name}', ${proj}`
      : `${proj} "${name}"`;
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
    return this.collection._schemaFields;
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

  absoluteField(name: string, jsonifyStarSelector = true) {
    if (name !== "*") {
      name = `"${name}"`;
    }
    const absoluteField = `"${this.primaryPrefix}".${name}`;
    return name.indexOf("*") > -1 && jsonifyStarSelector
      ? `ROW_TO_JSON(${absoluteField})`
      : absoluteField;
  }

  field(name: string, jsonifyStarSelector = true) {
    const absoluteField = this.absoluteField(name, jsonifyStarSelector);
    return this.isAggregate ? `'${name}', ${absoluteField}` : absoluteField;
  }

  currentUserField(name: string) {
    return `"currentUser"."${name}"`;
  }

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
      const normalizedExpression = expression.trim().replace(/\s+/g, " ");
      if (this.isAggregate) {
        this.projections.push(`'${name}', ${normalizedExpression}`);
      } else {
        this.projections.push(`${normalizedExpression} "${name}"`);
      }
    } else {
      this.projections.push(this.field(name, jsonifyStarSelector));
    }
  }

  addJoin({resolver, ...joinBase}: SqlResolverJoin) {
    const spec = this.getJoinSpec(joinBase);
    const subField = (name: string) => `"${spec.prefix}"."${name}"`;
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

  getSqlResolverArgs(): SqlResolverArgs {
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

  private getJoinSpec({table, type, on}: SqlJoinBase): SqlJoinSpec {
    for (const join of this.joins) {
      if (
        join.table === table &&
        join.type === type &&
        isEqual(join.on, on)
      ) {
        return join;
      }
    }
    const join = {table, type, on, prefix: this.generateTablePrefix()};
    this.joins.push(join);
    return join;
  }

  private compileJoin({table, type = "inner", on, prefix}: SqlJoinSpec): string {
    const selectors: string[] = [];
    for (const field in on) {
      selectors.push(`"${prefix}"."${field}" = ${on[field]}`);
    }
    const selector = selectors.join(" AND ");
    return `${type.toUpperCase()} JOIN "${table}" "${prefix}" ON ${selector}`;
  }

  compileQuery(): {sql: string, args: unknown[]} {
    const projection = this.projections.join(", ");
    const joins = this.joins.map((join) => this.compileJoin(join)).join(" ");
    const table = this.getTableName();
    const prefix = this.primaryPrefix;
    const sql = `SELECT ${projection} FROM ${table} "${prefix}" ${joins}`;
    return {
      sql,
      args: this.args,
    };
  }
}

export default ProjectionContext;
