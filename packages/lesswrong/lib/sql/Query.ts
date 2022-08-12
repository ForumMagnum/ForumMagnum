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
  $in: "IN",
  $nin: "NOT IN",
};

class Query<T extends DbObject> {
  private constructor(
    private table: Table,
    private atoms: Atom[] = [],
  ) {}

  toSQL(sql: SqlClient) {
    const {sql: sqlString, args} = this.compile();
    return sql.unsafe(sqlString, args);
  }

  compile() {
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

  private getTypeHint(typeHint?: any) {
    switch (typeof typeHint) {
      case "number":
        return Number.isInteger(typeHint) ? "::INTEGER" : "::REAL";
      case "string":
        return "::TEXT";
      default:
        return "";
    }
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

  private linkChain(chain: Atom[][], separator: string, prefix = "(", suffix = ")"): Atom[] {
    return [prefix, ...chain.flatMap((item) => [separator, ...item]).slice(1), suffix];
  }

  private compileMultiSelector(multiSelector: MongoSelector<T>, separator: string): Atom[] {
    const chain = Object.keys(multiSelector).map(
      (key) => this.compileSelector({[key]: multiSelector[key]})
    );
    return this.linkChain(chain, separator);
  }

  private compileComparison(field: string, value: any) {
    field = this.resolveFieldName(field, value);
    if (typeof value === "object") {
      if (value === null) {
        return [`${field} IS NULL`];
      }
      const comparer = Object.keys(value)[0];
      const op = comparisonOps[comparer];
      if (op) {
        return [`${field} ${op} `, new Arg(value[comparer])];
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
    }

    return this.compileComparison(key, value);
  }

  private appendSelector(selector: MongoSelector<T>) {
    this.atoms = this.atoms.concat(this.compileSelector(selector));
  }

  private appendOptions(options: MongoFindOptions<T>) {
    const {sort, limit, skip} = options;

    if (sort) {
      this.atoms.push("ORDER BY");
      for (const field in sort) {
        this.atoms.push(`${this.resolveFieldName(field)} ${sort[field] > 0 ? "ASC" : "DESC"}`);
      }
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

  static select<T extends DbObject>(
    table: Table,
    selector?: MongoSelector<T>,
    options?: MongoFindOptions<T>,
    count: boolean = false,
  ) {
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
