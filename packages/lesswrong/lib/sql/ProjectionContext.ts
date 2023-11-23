import PgCollection from "./PgCollection";
import isEqual from "lodash/isEqual";
import { randomId } from "../random";

export type CustomResolver<T extends DbObject = DbObject> =
  NonNullable<CollectionFieldSpecification<T>["resolveAs"]>;

export type CodeResolver<T extends DbObject = DbObject> =
  CustomResolver<T>["resolver"];

interface CodeResolverMap extends Record<string, CodeResolver | CodeResolverMap> {}

export type PrefixGenerator = () => string;

class ProjectionContext<T extends DbObject = DbObject> {
  private resolvers: Record<string, CustomResolver> = {};
  private projections: string[] = [];
  private joins: SqlJoinSpec[] = [];
  private args: unknown[] = [];
  private codeResolvers: CodeResolverMap = {};
  private primaryPrefix: string;
  private argOffset: number;
  private isAggregate: boolean;

  constructor(
    private collection: PgCollection<T>,
    aggregate?: {prefix: string, argOffset: number},
    private prefixGenerator?: PrefixGenerator,
  ) {
    if (aggregate) {
      this.primaryPrefix = aggregate.prefix;
      this.argOffset = aggregate.argOffset;
      this.isAggregate = true;
    } else {
      this.primaryPrefix = collection.table.getName()[0].toLowerCase();
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
    const test = `"${subcontext.primaryPrefix}"."_id"`;
    const obj = `JSONB_BUILD_OBJECT( ${subcontext.projections.join(", ")} )`;
    const proj = `CASE WHEN ${test} IS NULL THEN NULL ELSE ${obj} END "${name}"`;
    this.projections.push(proj);
    this.joins = this.joins.concat(subcontext.joins);
    this.args = this.args.concat(subcontext.args);
    if (Object.keys(subcontext.codeResolvers).length) {
      this.codeResolvers[name] = subcontext.codeResolvers;
    }
  }

  getCollection() {
    return this.collection;
  }

  getSchema() {
    // *sigh*
    const collection = this.collection as unknown as CollectionBase<DbObject>;
    return collection._schemaFields;
  }

  getResolver(name: string): CustomResolver | null {
    return this.resolvers[name] ?? null;
  }

  getTableName() {
    return `"${this.collection.table.getName()}"`;
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

  getCodeResolvers() {
    return this.codeResolvers;
  }

  getPrefixGenerator() {
    return this.prefixGenerator;
  }

  field(name: string) {
    let absoluteField = `"${this.primaryPrefix}"."${name}"`;
    if (name.indexOf("*") > -1) {
      absoluteField = `ROW_TO_JSON(${absoluteField})`;
    }
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

  addProjection(name: string, expression?: string) {
    if (expression) {
      const normalizedExpression = expression.trim().replace(/\s+/g, " ");
      this.projections.push(`${normalizedExpression} "${name}"`);
    } else {
      this.projections.push(this.field(name));
    }
  }

  addJoin({resolver, ...joinBase}: SqlResolverJoin) {
    const spec = this.getJoinSpec(joinBase);
    const subField = (name: string) => `"${spec.prefix}"."${name}"`;
    return resolver(subField);
  }

  addArg(value: unknown) {
    this.args.push(value);
    return `$${this.args.length + this.argOffset}`;
  }

  addCodeResolver(name: string, resolver: CodeResolver) {
    this.codeResolvers[name] = resolver;
  }

  getSqlResolverArgs(): SqlResolverArgs {
    return {
      field: this.field.bind(this),
      currentUserField: this.currentUserField.bind(this),
      join: this.addJoin.bind(this),
      arg: this.addArg.bind(this),
    };
  }

  private generateTablePrefix() {
    return this.prefixGenerator ? this.prefixGenerator() : randomId(5);
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
