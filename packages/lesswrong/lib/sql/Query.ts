import { getCollectionByTableName } from "../vulcan-lib";
import Table from "./Table";
import { Type, UnknownType } from "./Type";

class Arg {
  constructor(public value: any) {}
}

type Atom<T extends DbObject> = string | Arg | Query<T> | Table;

const isArrayOp = (op: string) => op === "$in" || op === "$nin";
const isMagnitudeOp = (op: string) => ["$lt", "$lte", "$gt", "$gte"].indexOf(op) > -1;

const comparisonOps = {
  $eq: "=",
  $ne: "<>",
  $lt: "<",
  $lte: "<=",
  $gt: ">",
  $gte: ">=",
  $in: "=",
  $nin: "<>",
};

const arithmeticOps = {
  $add: "+",
  $subtract: "-",
  $multiply: "*",
  $divide: "/",
  $pow: "^",
  ...comparisonOps,
};

export type SimpleLookup = {
  from: string,
  localField: string,
  foreignField: string,
  as: string,
}

export type PipelineLookup = {
  from: string,
  let: Record<string, any>,
  pipeline: Record<string, any>[],
  as: string,
}

export type Lookup = SimpleLookup | PipelineLookup;

export type SelectSqlOptions = Partial<{
  count: boolean,
  addFields: any // TODO typing
  lookup: Lookup,
  unwind: any, // TODO typing
  joinHook: string,
}>

class Query<T extends DbObject> {
  private syntheticFields: Record<string, Type> = {};
  private hasLateralJoin: boolean = false;
  private nameSubqueries: boolean = true;

  private constructor(
    private table: Table | Query<T>,
    private atoms: Atom<T>[] = [],
  ) {}

  getField(name: string) {
    return this.getFields()[name] ?? this.table?.getField(name);
  }

  getFields() {
    return this.table instanceof Query ? this.table.syntheticFields : this.table.getFields();
  }

  toSQL(sql: SqlClient) {
    const {sql: sqlString, args} = this.compile();
    return sql.unsafe(sqlString, args);
  }

  compile(argOffset = 0, subqueryOffset = 'A'.charCodeAt(0)): {sql: string, args: any[]} {
    const strings: string[] = [];
    let args: any[] = [];
    for (const atom of this.atoms) {
      if (atom instanceof Arg) {
        strings.push(`$${++argOffset}`);
        args.push(atom.value);
      } else if (atom instanceof Query) {
        strings.push("(");
        const subquery = this.nameSubqueries ? String.fromCharCode(subqueryOffset++) : "";
        const result = atom.compile(argOffset, subqueryOffset);
        strings.push(result.sql);
        args = args.concat(result.args);
        argOffset += result.args.length;
        strings.push(`) ${subquery}`);
      } else if (atom instanceof Table) {
        strings.push(`"${atom.getName()}"`);
      } else {
        strings.push(atom);
      }
    }
    return {
      sql: strings.join(" "),
      args,
    };
  }

  private getTypeHint(typeHint?: any): string {
    if (typeHint instanceof Type) {
      return "::" + typeHint.toConcrete().toString();
    }
    switch (typeof typeHint) {
      case "number":
        return Number.isInteger(typeHint) ? "::INTEGER" : "::REAL";
      case "string":
        return "::TEXT";
      case "boolean":
        return "::BOOL";
    }
    if (typeHint instanceof Date) {
      return "::TIMESTAMPTZ";
    }
    return "";
  }

  private getUnifiedTypeHint(a: Atom<T>[], b: Atom<T>[]): string | undefined {
    const aArg = a.find((atom) => atom instanceof Arg) as Arg;
    const bArg = b.find((atom) => atom instanceof Arg) as Arg;
    if (!aArg || !bArg || typeof aArg.value !== typeof bArg.value) {
      return undefined;
    }
    return this.getTypeHint(aArg.value);
  }

  private resolveTableName(): string {
    return this.table instanceof Table ? `"${this.table.getName()}".` : "";
  }

  private resolveFieldName(field: string, typeHint?: any): string {
    const arrayIndex = field.indexOf(".$");
    if (arrayIndex > -1) {
      throw new Error("Array fields not yet implemented");
    }

    const jsonIndex = field.indexOf(".");
    if (jsonIndex > -1) {
      const [first, ...rest] = field.split(".");
      if (this.getField(first)) {
        const hint = this.getTypeHint(typeHint);
        return [`("${first}"`, ...rest.map((token) => `'${token}'`)].join("->") + `)${hint}`;
      }
    }

    if (this.getField(field)) {
      return `"${field}"`;
    }

    throw new Error(`Cannot resolve field name: ${field}`);
  }

  private getStarSelector() {
    return this.table instanceof Table && !this.hasLateralJoin ? `"${this.table.getName()}".*` : "*";
  }

  private compileMultiSelector(multiSelector: MongoSelector<T>, separator: string): Atom<T>[] {
    const result = Array.isArray(multiSelector)
      ? multiSelector.map((selector) => this.compileSelector(selector))
      : Object.keys(multiSelector).map(
        (key) => this.compileSelector({[key]: multiSelector[key]})
      );
    return [
      "(",
      ...result.filter((a) => a.length).flatMap((item) => [separator, ...item]).slice(1),
      ")",
    ];
  }

  private compileComparison(fieldName: string, value: any): Atom<T>[] {
    if (value === undefined) {
      return [];
    }
    const field = this.resolveFieldName(fieldName, value);
    if (typeof value === "object") {
      if (value === null) {
        return [`${field} IS NULL`];
      }
      const comparer = Object.keys(value)[0];
      if (comparer === "$exists") {
        return [`${field} ${value["$exists"] ? "IS NOT NULL" : "IS NULL"}`];
      }
      const op = comparisonOps[comparer];
      if (op) {
        if (isArrayOp(comparer) && Array.isArray(value[comparer])) {
          const typeHint = this.getTypeHint(this.getField(fieldName));
          const args = value[comparer].flatMap((item: any) => [",", new Arg(item)]).slice(1);
          return [`${field} ${op} ANY(ARRAY[`, ...args, `]${typeHint ? typeHint + "[]" : ""})`];
        } else {
          return [`${field} ${op} `, new Arg(value[comparer])];
        }
      } else {
        throw new Error(`Invalid comparison selector: ${field}: ${JSON.stringify(value)}`);
      }
    }
    return [`${field} = `, new Arg(value)];
  }

  private compileSelector(selector: MongoSelector<T>): Atom<T>[] {
    /*
     * TODO: Internal documentation, examples
     */
    const keys = Object.keys(selector);
    if (keys.length === 0) {
      return [];
    } else if (keys.length > 1) {
      return this.compileSelector({ $and: selector });
    }

    const key = keys[0];
    const value = selector[key];
    switch (key) {
      case "$and":
        return this.compileMultiSelector(value, "AND");
      case "$or":
        return this.compileMultiSelector(value, "OR");
      case "$comment":
        return [];
    }

    return this.compileComparison(key, value);
  }

  private appendSelector(selector: MongoSelector<T>): void {
    this.atoms = this.atoms.concat(this.compileSelector(selector));
  }

  private compileSetFields(updates: Partial<Record<keyof T, any>>): Atom<T>[] {
    return Object.keys(updates).flatMap((field) => [
      ",",
      this.resolveFieldName(field),
      "=",
      ...this.compileExpression(updates[field]),
    ]).slice(1);
  }

  private appendLateralJoin(lookup: Lookup): void {
    const {from, as} = lookup;
    if (!from || !as) {
      throw new Error("Invalid $lookup");
    }

    if ("localField" in lookup && "foreignField" in lookup) {
      const {localField, foreignField} = lookup;
      const table = getCollectionByTableName(from).collectionName;
      this.atoms.push(`, LATERAL (SELECT jsonb_agg("${table}".*) AS "${as}" FROM "${table}" WHERE`);
      this.atoms.push(`${this.resolveTableName()}"${localField}" = "${table}"."${foreignField}") Q`);
    } else if ("let" in lookup && "pipeline" in lookup) {
      throw new Error("Pipeline joins are not being implemented - write raw SQL");
    } else {
      throw new Error("Invalid $lookup");
    }
  }

  private appendOptions(options: MongoFindOptions<T>): void {
    const {sort, limit, skip} = options;

    if (sort && Object.keys(sort).length) {
      this.atoms.push("ORDER BY");
      const sorts: string[] = [];
      for (const field in sort) {
        sorts.push(`${this.resolveFieldName(field)} ${sort[field] > 0 ? "ASC" : "DESC"}`);
      }
      this.atoms.push(sorts.join(", "));
    }

    if (limit) {
      this.atoms.push("LIMIT");
      this.atoms.push(new Arg(limit));
    }

    if (skip) {
      this.atoms.push("OFFSET");
      this.atoms.push(new Arg(skip));
    }
  }

  private appendValuesList(data: T): void {
    const fields = this.table.getFields();
    const keys = Object.keys(fields);
    this.atoms.push("(");
    let prefix = "";
    for (const key of keys) {
      this.atoms.push(`${prefix}"${key}"`);
      prefix = ", ";
    }
    this.atoms.push(") VALUES (");
    prefix = "";
    for (const key of keys) {
      this.atoms.push(prefix);
      this.atoms.push(new Arg(data[key] ?? null));
      prefix = ", ";
    }
    this.atoms.push(")");
  }

  private getProjectedFields(
    table: Table | Query<T>,
    count?: boolean,
    projection?: MongoProjection<T>,
  ): Atom<T>[] {
    if (count) {
      return ["count(*)"];
    }

    if (!projection) {
      return [this.getStarSelector()];
    }

    const include: string[] = [];
    const exclude: string[] = [];
    const addFields: Record<string, any> = {};

    for (const key of Object.keys(projection)) {
      if (projection[key]) {
        if (typeof projection[key] === "object") {
          addFields[key] = projection[key];
        } else {
          include.push(key);
        }
      } else {
        exclude.push(key);
      }
    }

    let fields: string[] = [this.getStarSelector()];
    if (include.length && !exclude.length) {
      if (!include.includes("_id")) {
        include.push("_id");
      }
      fields = include;
    } else if (!include.length && exclude.length) {
      fields = Object.keys(table.getFields()).filter((field) => !exclude.includes(field));
    } else if (include.length && exclude.length) {
      if (!include.includes("_id") && !exclude.includes("_id")) {
        include.push("_id");
      }
      fields = include;
    }

    let projectedAtoms: Atom<T>[] = [fields.map((field) => field.indexOf("*") > -1 ? field : `"${field}"`).join(", ")];
    if (Object.keys(addFields).length) {
      projectedAtoms = projectedAtoms.concat(this.getSyntheticFields(addFields));
    }
    return projectedAtoms;
  }

  private compileExpression(expr: any, typeHint?: any): Atom<T>[] {
    if (typeof expr === "string") {
      return [expr[0] === "$" ? this.resolveFieldName(expr.slice(1), typeHint) : new Arg(expr)];
    } else if (typeof expr !== "object" || expr === null || expr instanceof Date) {
      return [new Arg(expr)];
    }

    const op = Object.keys(expr)[0];
    if (arithmeticOps[op]) {
      const isMagnitude = isMagnitudeOp(op);
      const operands = expr[op].map((arg: any) => this.compileExpression(arg, isMagnitude ? 0 : undefined));
      const isDateDiff = op === "$subtract" && operands.length === 2 && operands.some(
        (arr: Atom<T>[]) => arr.some((atom) => atom instanceof Arg && atom.value instanceof Date)
      );
      let result: Atom<T>[] = [isDateDiff ? "(1000 * EXTRACT(EPOCH FROM" : "("];
      for (let i = 0; i < operands.length; i++) {
        if (i > 0) {
          result.push(arithmeticOps[op]);
        }
        result = result.concat(operands[i]);
      }
      result.push(isDateDiff ? "))" : ")");
      return result;
    }

    if (op === "$cond") {
      const ifExpr = this.compileCondition(expr[op].if);
      const thenExpr = this.compileExpression(expr[op].then);
      const elseExpr = this.compileExpression(expr[op].else);
      const hint = this.getUnifiedTypeHint(thenExpr, elseExpr);
      const result = ["(CASE WHEN", ...ifExpr, "THEN", ...thenExpr, "ELSE", ...elseExpr, "END)"];
      return hint ? [...result, hint] : result;
    }

    if (op === "$abs") {
      return ["ABS(", ...this.compileExpression(expr[op]), ")"];
    }

    throw new Error(`Invalid expression: ${JSON.stringify(expr)}`);
  }

  private compileCondition(expr: any): Atom<T>[] {
    if (typeof expr === "string" && expr[0] === "$") {
      const name = expr.slice(1);
      return [this.resolveFieldName(name), "IS NOT NULL"];
    }
    return this.compileExpression(expr);
  }

  private getSyntheticFields(addFields: Record<string, any>): Atom<T>[] {
    for (const field in addFields) {
      this.syntheticFields[field] = new UnknownType();
    }
    return Object.keys(addFields).flatMap((field) =>
      [",", ...this.compileExpression(addFields[field]), "AS", `"${field}"`]
    );
  }

  private disambiguateSyntheticFields(addFields?: any, projection?: MongoProjection<T>) {
    if (addFields) {
      const fields = Object.keys(addFields);
      for (const field of fields) {
        const existingType = this.table.getField(field);
        if (existingType) {
          if (!projection) {
            projection = {};
          }
          projection[field] = 0;
        }
      }
    }
    return {addFields, projection};
  }

  static insert<T extends DbObject>(table: Table, data: T, allowConflicts = false): Query<T> {
    const query = new Query<T>(table, [`INSERT INTO "${table.getName()}"`]);
    query.appendValuesList(data);
    if (allowConflicts) {
      query.atoms.push("ON CONFLICT DO NOTHING");
    }
    return query;
  }

  static select<T extends DbObject>(
    table: Table | Query<T>,
    selector?: string | MongoSelector<T>,
    options?: MongoFindOptions<T>,
    sqlOptions?: SelectSqlOptions,
  ): Query<T> {
    if (typeof selector === "string") {
      selector = {_id: selector};
    }

    const query = new Query(table, ["SELECT"]);
    query.hasLateralJoin = !!sqlOptions?.lookup;

    const {addFields, projection} = query.disambiguateSyntheticFields(sqlOptions?.addFields, options?.projection);
    query.atoms = query.atoms.concat(query.getProjectedFields(table, sqlOptions?.count, projection));
    if (addFields) {
      query.atoms = query.atoms.concat(query.getSyntheticFields(addFields));
    }
    query.atoms = query.atoms.concat(["FROM", table]);

    if (sqlOptions?.lookup) {
      query.appendLateralJoin(sqlOptions.lookup);
    }

    if (sqlOptions?.joinHook) {
      query.atoms.push(sqlOptions.joinHook);
    }

    if (selector && Object.keys(selector).length > 0) {
      query.atoms.push("WHERE");
      query.appendSelector(selector);
    }

    if (options) {
      if (options.collation) {
        throw new Error("Collation not yet implemented")
      }
      query.appendOptions(options);
    }

    return query;
  }

  static update<T extends DbObject>(
    table: Table,
    selector: string | MongoSelector<T>,
    modifier: MongoModifier<T>,
    options?: MongoUpdateOptions<T>, // TODO: What can options be?
    limit?: number,
  ): Query<T> {
    if (typeof selector === "string") {
      selector = {_id: selector};
    }

    const query = new Query(table, ["UPDATE", table, "SET"]);
    query.nameSubqueries = false;

    const set: Partial<Record<keyof T, any>> = modifier.$set ?? {};
    for (const operation of Object.keys(modifier)) {
      switch (operation) {
        case "$set":
          break;
        case "$unset":
          for (const field of Object.keys(modifier.$unset)) {
            set[field] = null;
          }
          break;
        case "$inc":
          for (const field of Object.keys(modifier.$inc)) {
            set[field] = {$add: [`$${field}`, 1]};
          }
          break;
        default:
          throw new Error("Unimplemented update operation: " + operation);
      }
    }

    query.atoms = query.atoms.concat(query.compileSetFields(set));

    if (selector && Object.keys(selector).length > 0) {
      query.atoms.push("WHERE");

      if (limit) {
        query.atoms = query.atoms.concat([
          "_id IN",
          Query<T>.select(table, selector, {limit, projection: {_id: 1}}),
        ]);
      } else {
        query.appendSelector(selector);
      }
    } else if (limit) {
      query.atoms = query.atoms.concat(["WHERE _id IN ( SELECT \"_id\" FROM", table, "LIMIT", new Arg(limit), ")"]);
    }

    return query;
  }
}

export default Query;
