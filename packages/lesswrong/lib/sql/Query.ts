import { getCollectionByTableName } from "../vulcan-lib";
import Table from "./Table";

class Arg {
  constructor(public value: any) {}
}

type Atom<T extends DbObject> = string | Arg | Query<T> | Table;

const arithmeticOps = {
  $add: "+",
  $subtract: "-",
  $multiply: "*",
  $divide: "/",
  $pow: "^",
};

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

const isArrayOp = (op: string) => op === "$in" || op === "$nin";

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

export type SelectSqlOptions = {
  count?: boolean,
  addFields?: any // TODO typing
  lookup?: Lookup,
  unwind?: any, // TODO typing
}

class Query<T extends DbObject> {
  private constructor(
    private table: Table | Query<T>,
    private atoms: Atom<T>[] = [],
  ) {}

  getField(name: string) {
    return this.table.getField(name);
  }

  getFields() {
    if (this.table instanceof Query) throw new Error("TODO: getFields for Query");
    return this.table.getFields();
  }

  toSQL(sql: SqlClient) {
    const {sql: sqlString, args} = this.compile();
    return sql.unsafe(sqlString, args);
  }

  compile(argOffset = 0): {sql: string, args: any[]} {
    let argCount = argOffset;
    const strings: string[] = [];
    let args: any[] = [];
    for (const atom of this.atoms) {
      if (atom instanceof Arg) {
        strings.push(`$${++argCount}`);
        args.push(atom.value);
      } else if (atom instanceof Query) {
        strings.push("(");
        const result = atom.compile(argOffset);
        strings.push(result.sql);
        args = args.concat(result.args);
        argCount += result.args.length;
        strings.push(")");
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

  private compileComparison(field: string, value: any): Atom<T>[] {
    if (value === undefined) {
      return [];
    }
    field = this.resolveFieldName(field, value);
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
        return isArrayOp(comparer)
          ? [`${field} ${op} ANY(`, new Arg(value[comparer]), ")"]
          : [`${field} ${op} `, new Arg(value[comparer])];
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

  private getProjectedFields<T extends DbObject>(
    table: Table | Query<T>,
    count?: boolean,
    projection?: MongoProjection<T>,
  ) {
    if (count) {
      return "count(*)";
    }

    if (projection) {
      const include: string[] = [];
      const exclude: string[] = [];

      for (const key of Object.keys(projection)) {
        if (projection[key]) {
          include.push(key);
        } else {
          exclude.push(key);
        }
      }

      let fields: string[] = [];

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
      } else {
        return "*";
      }

      return fields.map((field) => `"${field}"`).join(", ");
    }

    return "*";
  }

  private compileExpression(expr: any): Atom<T>[] {
    if (typeof expr === "string") {
      return [expr[0] === "$" ? this.resolveFieldName(expr.slice(1)) : new Arg(expr)];
    } else if (typeof expr !== "object" || expr === null || expr instanceof Date) {
      return [new Arg(expr)];
    }

    const op = Object.keys(expr)[0];
    if (arithmeticOps[op]) {
      const operands = expr[op].map((arg: any) => this.compileExpression(arg));
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
      return [
        "(CASE WHEN",
        ...this.compileCondition(expr[op].if),
        "THEN",
        ...this.compileExpression(expr[op].then),
        "ELSE",
        ...this.compileExpression(expr[op].else),
        "END)",
      ];
    }

    throw new Error(`Invalid expression: ${JSON.stringify(expr)}`);
  }

  private compileCondition(expr: any): Atom<T>[] {
    if (typeof expr === "string" && expr[0] === "$") {
      return [this.resolveFieldName(expr.slice(1)), "IS NOT NULL"];
    }
    return this.compileExpression(expr);
  }

  private getSyntheticFields<S extends {}>(addFields: S) {
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
    selector?: MongoSelector<T>,
    options?: MongoFindOptions<T>,
    sqlOptions?: SelectSqlOptions,
  ): Query<T> {
    const query = new Query(table, ["SELECT"]);

    const {addFields, projection} = query.disambiguateSyntheticFields(sqlOptions?.addFields, options?.projection);
    query.atoms.push(query.getProjectedFields(table, sqlOptions?.count, projection));
    if (addFields) {
      query.atoms = query.atoms.concat(query.getSyntheticFields(addFields));
    }
    query.atoms = query.atoms.concat(["FROM", table]);

    if (sqlOptions?.lookup) {
      query.appendLateralJoin(sqlOptions.lookup);
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
}

export default Query;
