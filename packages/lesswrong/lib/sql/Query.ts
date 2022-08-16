import Table from "./Table";

class Arg {
  constructor(public value: any) {}
}

type Atom = string | Arg;

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

class Query<T extends DbObject> {
  private constructor(
    private table: Table,
    private atoms: Atom[] = [],
  ) {}

  toSQL(sql: SqlClient) {
    const {sql: sqlString, args} = this.compile();
    return sql.unsafe(sqlString, args);
  }

  compile(): {sql: string, args: any[]} {
    let argCount = 0;
    const strings: string[] = [];
    const args: any[] = [];
    for (const atom of this.atoms) {
      if (atom instanceof Arg) {
        strings.push(`$${++argCount}`);
        args.push(atom.value);
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

  private resolveFieldName(field: string, typeHint?: any): string {
    const arrayIndex = field.indexOf(".$");
    if (arrayIndex > -1) {
      throw new Error("Array fields not yet implemented");
    }

    const jsonIndex = field.indexOf(".");
    if (jsonIndex > -1) {
      const [first, ...rest] = field.split(".");
      if (this.table.getField(first)) {
        const hint = this.getTypeHint(typeHint);
        return [`("${first}"`, ...rest.map((token) => `'${token}'`)].join("->") + `)${hint}`;
      }
    }

    if (this.table.getField(field)) {
      return `"${field}"`;
    }

    throw new Error(`Cannot resolve ${this.table.getName()} field name: ${field}`);
  }

  private compileMultiSelector(multiSelector: MongoSelector<T>, separator: string): Atom[] {
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

  private compileComparison(field: string, value: any): Atom[] {
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

  private compileSelector(selector: MongoSelector<T>): Atom[] {
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

  static insert<T extends DbObject>(table: Table, data: T, allowConflicts = false): Query<T> {
    const query = new Query(table, [`INSERT INTO "${table.getName()}"`]);
    query.appendValuesList(data);
    if (allowConflicts) {
      query.atoms.push("ON CONFLICT DO NOTHING");
    }
    return query;
  }

  static select<T extends DbObject>(
    table: Table,
    selector?: MongoSelector<T>,
    options?: MongoFindOptions<T>,
    count: boolean = false,
  ): Query<T> {
    const fields = count ? "count(*)" : "*";
    const query = new Query(table, [`SELECT ${fields} FROM "${table.getName()}"`]);

    if (selector && Object.keys(selector).length > 0) {
      query.atoms.push("WHERE");
      query.appendSelector(selector);
    }

    if (options) {
      query.appendOptions(options);
    }

    return query;
  }
}

export default Query;
