import Table from "./Table";
import { Type } from "./Type";

class Arg {
  public typehint = "";

  constructor(public value: any) {
    // JSON arrays make node-postgres fall over, but we can work around it
    // with a special-case typehint
    if (Array.isArray(value) && value[0] && typeof value[0] === "object") {
      this.typehint = "::JSONB[]";
    }
  }
}

export type Atom<T extends DbObject> = string | Arg | Query<T> | Table;

const isMagnitudeOp = (op: string) => ["$lt", "$lte", "$gt", "$gte"].indexOf(op) > -1;

const comparisonOps = {
  $eq: "=",
  $ne: "<>",
  $lt: "<",
  $lte: "<=",
  $gt: ">",
  $gte: ">=",
};

const arithmeticOps = {
  $add: "+",
  $subtract: "-",
  $multiply: "*",
  $divide: "/",
  $pow: "^",
  ...comparisonOps,
};

abstract class Query<T extends DbObject> {
  protected syntheticFields: Record<string, Type> = {};
  protected nameSubqueries = true;

  protected constructor(
    protected table: Table | Query<T>,
    protected atoms: Atom<T>[] = [],
  ) {}

  getField(name: string) {
    return this.getFields()[name] ?? this.table?.getField(name);
  }

  getFields() {
    return this.table instanceof Query ? this.table.syntheticFields : this.table.getFields();
  }

  toSQL(sql: SqlClient) {
    const {sql: sqlString, args} = this.compile();
    return sql.any(sqlString, args);
  }

  compile(argOffset = 0, subqueryOffset = 'A'.charCodeAt(0)): {sql: string, args: any[]} {
    const strings: string[] = [];
    let args: any[] = [];
    for (const atom of this.atoms) {
      if (atom instanceof Arg) {
        strings.push(`$${++argOffset}${atom.typehint}`);
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

  protected createArg(value: any) {
    return new Arg(value);
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

  protected resolveTableName(): string {
    return this.table instanceof Table ? `"${this.table.getName()}".` : "";
  }

  protected resolveFieldName(field: string, typeHint?: any): string {
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

  private arrayify(unresolvedField: string, resolvedField: string, op: string, value: any): Atom<T>[] {
    const ty = this.getField(unresolvedField);
    if (ty && ty.isArray() && !Array.isArray(value)) {
      if (op === "<>") {
        return ["NOT (", new Arg(value), `= ANY(${resolvedField}) )`];
      } else {
        return [new Arg(value), `${op} ANY(${resolvedField})`];
      }
    } else {
      const hint = unresolvedField.indexOf(".") > 0 && resolvedField.indexOf("::") < 0 ? this.getTypeHint(value) : "";
      return [`${resolvedField}${hint} ${op} `, new Arg(value)];
    }
  }

  private compileComparison(fieldName: string, value: any): Atom<T>[] {
    const field = this.resolveFieldName(fieldName, value);
    if (value === null || value === undefined) {
      return [`${field} IS NULL`];
    }
    if (typeof value === "object") {
      const comparer = Object.keys(value)[0];
      switch (comparer) {
        case "$not":
          return ["NOT (", ...this.compileComparison(fieldName, value[comparer]), ")"];
        case "$nin":
          return this.compileComparison(fieldName, {$not: {$in: value[comparer]}});
        case "$in":
          if (!Array.isArray(value[comparer])) {
            throw new Error("$in expects an array");
          }
          const typeHint = this.getTypeHint(this.getField(fieldName));
          const args = value[comparer].flatMap((item: any) => [",", new Arg(item)]).slice(1);
          return [`${field} = ANY(ARRAY[`, ...args, `]${typeHint ? typeHint + "[]" : ""})`];
        case "$exists":
          return [`${field} ${value["$exists"] ? "IS NOT NULL" : "IS NULL"}`];
        default:
          break;
      }
      const op = comparisonOps[comparer];
      if (op) {
        return this.arrayify(fieldName, field, op, value[comparer]);
      } else {
        throw new Error(`Invalid comparison selector: ${field}: ${JSON.stringify(value)}`);
      }
    }
    return this.arrayify(fieldName, field, "=", value);
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

  protected compileSelector(selector: MongoSelector<T>): Atom<T>[] {
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
      case "$expr":
        return this.compileExpression(value);
      case "$comment":
        return [];
    }

    return this.compileComparison(key, value);
  }

  protected appendSelector(selector: MongoSelector<T>): void {
    this.atoms = this.atoms.concat(this.compileSelector(selector));
  }

  private compileCondition(expr: any): Atom<T>[] {
    if (typeof expr === "string" && expr[0] === "$") {
      const name = expr.slice(1);
      return [this.resolveFieldName(name), "IS NOT NULL"];
    }
    return this.compileExpression(expr);
  }

  protected compileExpression(expr: any, typeHint?: any): Atom<T>[] {
    if (typeof expr === "string") {
      return [expr[0] === "$" ? this.resolveFieldName(expr.slice(1), typeHint) : new Arg(expr)];
    } else if (typeof expr !== "object" || expr === null || expr instanceof Date || Array.isArray(expr)) {
      return [new Arg(expr)];
    }

    const op = Object.keys(expr)[0];
    if (op?.[0] !== "$") {
      return [new Arg({[op]: expr[op]})]
    }

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

    if (op === "$sum") {
      return ["SUM(", ...this.compileExpression(expr[op]), ")"];
    }

    if (op === "$in") {
      const [value, array] = expr[op];
      return [...this.compileExpression(value), "= ANY(", ...this.compileExpression(array), ")"];
    }

    // This algorithm is over-specialized, but we only seem to use it in a very particular way...
    if (op === "$arrayElemAt") {
      const [array, index] = expr[op];
      if (typeof array !== "string" || array[0] !== "$" || typeof index !== "number") {
        throw new Error("Invalid arguments to $arrayElemAt");
      }
      const tokens = array.split(".");
      const field = tokens[0][0] === "$" ? tokens[0].slice(1) : tokens[0];
      const path = tokens.slice(1).flatMap((name) => ["->", `'${name}'`]);
      if (path.length) {
        path[path.length - 2] = "->>";
      }
      return [`("${field}")[${index}]${path.join("")}`];
    }

    if (op === "$first") {
      return this.compileExpression(expr[op]);
    }

    if (op === undefined) {
      return ["'{}'::JSONB"];
    }

    throw new Error(`Invalid expression: ${JSON.stringify(expr)}`);
  }
}

export default Query;
