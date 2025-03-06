import Table from "./Table";
import { Type, JsonType, ArrayType, NotNullType, DefaultValueType } from "./Type";

/**
 * Arg is a wrapper to mark a particular value as being an argument for the
 * query. When compiled, the value will be placed into the `args` array, and
 * a `$n` reference will be placed in the appropriate place in the SQL string.
 */
class Arg {
  public typehint = "";

  constructor(public value: any, type?: Type) {
    if (this.value === null && type instanceof DefaultValueType && type.isNotNull() && type.getDefaultValueString()) {
      if (type.isArray() || type.toConcrete() instanceof JsonType) {
        this.value = type.getDefaultValue();
      } else {
        this.value = type.getDefaultValueString();
      }
    }

    // JSON arrays make node-postgres fall over, but we can work around it
    // with a special-case typehint
    if (Array.isArray(this.value) && this.value[0] && typeof this.value[0] === "object") {
      if (type?.toConcrete() instanceof JsonType) {
        this.value = JSON.stringify(this.value);
        this.typehint = "::JSONB";
      } else {
        this.typehint = "::JSONB[]";
      }
    } else if ((typeof this.value !== "object" || Array.isArray(this.value)) && type?.toConcrete() instanceof JsonType) {
      this.value = JSON.stringify(this.value);
      this.typehint = "::JSONB";
    }
  }
}

/**
 * The Atom represents one 'part' of a Postgres query. This could be a literal
 * string of SQL, an argument, a sub-query, or a table (which will be compiled
 * to its name).
 */
export type Atom<T extends DbObject> = string | Arg | Query<T> | Table<T>;

const atomIsArg = <T extends DbObject>(atom: Atom<T>): atom is Arg => atom instanceof Arg;

class NonScalarArrayAccessError extends Error {
  constructor(public fieldName: string, public path: string[]) {
    super("Non-scalar array access");
  }
}

const isMagnitudeOp = (op: string) => ["$lt", "$lte", "$gt", "$gte"].indexOf(op) > -1;

const comparisonOps = {
  $eq: "=",
  $ne: "<>",
  $lt: "<",
  $lte: "<=",
  $gt: ">",
  $gte: ">=",
} as const;

const arithmeticOps = {
  $add: "+",
  $subtract: "-",
  $multiply: "*",
  $divide: "/",
  $pow: "^",
  ...comparisonOps,
} as const;

const variadicFunctions = {
  $min: "LEAST",
  $max: "GREATEST",
  $ifNull: "COALESCE",
} as const;

/**
 * Sorting locations by distance is done in Mongo using the `$near` selector operator
 * instead of using `sort` - this means we have to save the value when building the
 * selector for later use.
 */
type NearbySort = {
  field: string,
  lng: number,
  lat: number,
}

/**
 * Query is the base class of the query builder which defines a number of common
 * functionalities (such as compiling artitrary expressions or selectors), as well
 * as the generic compilation algorithm. This class is extended by several concrete
 * classes, each of which implements a particular type of Postgres query, such as
 * SelectQuery or CreateIndexQuery (these provide the interface that you want to
 * use as an end user).
 *
 * Once a query has been created, calling `query.compile()` will return a SQL
 * string and an array of arguments which can be passed into the Postgres client
 * for execution.
 *
 * The logic here is quite complex, so please add more unit tests with any new
 * features.
 *
 * The general approach is to construct an internal array of `Atoms` (see above)
 * each representing a small part of the query and which are concatonated when we
 * call `compile`. Due to the fact that `Query` is itself a type of `Atom`, this
 * process can be recursive. Arguments are also automatically converted to `$n`
 * references at compile time.
 */
abstract class Query<T extends DbObject> {
  protected syntheticFields: Record<string, Type> = {};
  protected nameSubqueries = true;
  protected isIndex = false;
  protected nearbySort: NearbySort | undefined;
  protected isCaseInsensitive = false;

  protected constructor(
    protected table: Table<T> | Query<T>,
    protected atoms: Atom<T>[] = [],
    protected primaryPrefix: string | null = null,
  ) {}

  /**
   * `compile` is the main external interface provided by Query - it turns the
   * query into an executable SQL string and an array of arguments that together
   * can be passed into a SQL client for execution.
   *
   * `argOffset` specifies the numerical index to begin creating `$n` references at.
   *
   * `subqueryOffset` specifices the ASCII character code of the character to begin
   * labelling subqueries at.
   *
   * In general, external users should never need to provide values for these arguments
   * (you're _very_ likely to break something if you do), but they're provided in the
   * public API for flexability.
   */
  compile(argOffset = 0, subqueryOffset = 'A'.charCodeAt(0)): {sql: string, args: any[]} {
    return this.compileAtoms(this.atoms, argOffset, subqueryOffset);
  }
  
  compileAtoms(atoms: Atom<T>[], argOffset = 0, subqueryOffset = 'A'.charCodeAt(0)): {sql: string, args: any[]} {
    const strings: string[] = [];
    let args: any[] = [];
    
    const comment = this.getSqlComment();
    if (comment) {
      strings.push(`-- ${comment}\n`);
    }
    
    for (const atom of atoms) {
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
  
  getSqlComment(): string|null {
    return null;
  }

  /**
   * Lookup a field in the current scope.
   */
  getField(name: string): Type | undefined {
    return this.getFields()[name] ?? this.table?.getField(name);
  }

  /**
   * Get all the fields defined in the current scope (does not return fields defined
   * in parent scopes).
   */
  getFields(): Record<string, Type> {
    return this.table instanceof Query ? this.table.syntheticFields : this.table.getFields();
  }

  /**
   * Internal helper to create a new Arg - allows us to encapsulate Arg
   * locally in this file.
   */
  protected createArg(value: any, type?: Type) {
    return new Arg(value, type);
  }

  /**
   * In complex queries, we (very) often need to provide typehints to make Postgres
   * happy (especially when using aggregations which result in subqueries with
   * synthetic fields). `getTypeHint` attempts to provide such a hint, returning the
   * empty string if one cannot be determined.
   *
   * If `typeHint` is an instance of `Type` then that type will be used, otherwise
   * `typeHint` is assumed to be the value we are getting the type for.
   */
  protected getTypeHint(typeHint?: any): string {
    if (typeHint === null || typeHint === undefined) {
      return "";
    }
    if (typeHint instanceof Type) {
      return "::" + typeHint.toConcrete().toString();
    }
    if (typeHint instanceof Date) {
      return "::TIMESTAMPTZ";
    }
    if (Array.isArray(typeHint)) {
      return "";
    }
    switch (typeof typeHint) {
      case "number":
        return Number.isInteger(typeHint) ? "::INTEGER" : "::REAL";
      case "string":
        return "::TEXT";
      case "boolean":
        return "::BOOL";
      case "object":
        return Object.keys(typeHint).some((key) => key[0] === "$")
          ? ""
          : "::JSONB";
      default:
        return "";
    }
  }

  /**
   * Sometimes, we require two values to have the same type hint (for instance, when
   * using binary comparison operators), even if those values could be given more
   * precise type hints separately in isolation.
   */
  private getUnifiedTypeHint(a: Atom<T>[], b: Atom<T>[]): string | undefined {
    const aArg = a.find(atomIsArg);
    const bArg = b.find(atomIsArg);
    if (!aArg || !bArg || typeof aArg.value !== typeof bArg.value) {
      return undefined;
    }
    return this.getTypeHint(aArg.value);
  }

  /**
   * Table names must be correctly quoted to allow for capitalization.
   */
  protected resolveTableName(): string {
    return this.table instanceof Table ? `"${this.table.getName()}".` : "";
  }

  /**
   * Add the (optional) table prefix to a field name
  */
  protected prefixify(field: string) {
    const prefix = this.primaryPrefix ? `"${this.primaryPrefix}".` : "";
    return prefix + field;
  }

  /**
   * Convert a Mongo selector field into a string that Postgres can understand. The
   * `field` may be a simple field name, or it may dereference a JSON object or
   * index an array.
   *
   * For valid values of the optional `typeHint`, see `getTypeHint`.
   */
  protected resolveFieldName(field: string, typeHint?: any): string {
    const arrayIndex = field.indexOf(".$");
    if (arrayIndex > -1) {
      throw new Error("`.$` array fields not implemented");
    }

    const jsonIndex = field.indexOf(".");
    if (jsonIndex > -1) {
      const [first, ...rest] = field.split(".");
      const fieldType = this.getField(first);
      if (fieldType instanceof ArrayType && !this.isIndex) {
        throw new NonScalarArrayAccessError(first, rest);
      } else if (fieldType) {
        const hint = this.getTypeHint(typeHint);
        const result = "(" + this.prefixify(`"${first}"`) +
          rest.map((element) => element.match(/^\d+$/) ? `[${element}]` : `->'${element}'`).join("") +
          `)${hint}`;
        return hint === "::TEXT"
          ? result.replace(/->(?!.*->)/, "->>")
          : result;
      }
    }

    if (this.getField(field)) {
      return this.prefixify(`"${field}"`);
    }

    if (this.syntheticFields[field]) {
      // Don't prefixify synthetic fields
      return `"${field}"`;
    }

    throw new Error(`Cannot resolve field name: ${field}`);
  }

  /**
   * Mongo is happy to treat arrays and scalar values as being effectively
   * interchangable, but Postgres is more picky. This helper allows us to
   * localize the special handling needed when we operate on a value that
   * is an array, despite not necessarily being marked as one explicitely in
   * the selector.
   */
  private arrayify(unresolvedField: string, resolvedField: string, op: string, value: any): Atom<T>[] {
    const fieldType = this.getField(unresolvedField);
    const concreteFieldType = fieldType?.toConcrete();
    if (concreteFieldType?.isArray() && !Array.isArray(value)) {
      if (op === "<>") {
        return [`NOT (${resolvedField} @> ARRAY[`, new Arg(value), `]::${concreteFieldType.toString()})`];
      } else if (op === "=") {
        return [`${resolvedField} @> ARRAY[`, new Arg(value), `]::${concreteFieldType.toString()}`];
      } else {
        throw new Error(`Invalid array operator: ${op}`);
      }
    } else {
      const hint = unresolvedField.indexOf(".") > 0 && resolvedField.indexOf("::") < 0 ? this.getTypeHint(value) : "";
      if (value === null) {
        if (op === "=") {
          return [`${resolvedField}${hint} IS NULL`];
        } else if (op === "<>") {
          return [`${resolvedField}${hint} IS NOT NULL`];
        }
      } else if (value === true) {
        if (op === "=") {
          return [`${resolvedField}${hint} IS TRUE`];
        } else if (op === "<>") {
          return [`${resolvedField}${hint} IS NOT TRUE`];
        }
      } else if (value === false) {
        if (op === "=") {
          return [`${resolvedField}${hint} IS FALSE`];
        } else if (op === "<>") {
          return [`${resolvedField}${hint} IS NOT FALSE`];
        }
      }
      if (op === "=" && this.isCaseInsensitive && typeof value === "string") {
        return [`LOWER(${resolvedField}) ${op} LOWER(`, new Arg(value), ")"];
      }
      /**
       * `<>` returns null if either of the compared values are null
       * This is generally not the result you want when checking whether a field is $ne to a specific value
       * So for nullable fields (most of them, so far) use `IS DISTINCT FROM`
       * This will return records where e.g. the field is null and you want everything not equal to 5.
       */
      if (!(fieldType instanceof NotNullType) && op === "<>") {
        return [`${resolvedField}${hint} IS DISTINCT FROM `, new Arg(value)];
      }
      return [`${resolvedField}${hint} ${op} `, new Arg(value)];
    }
  }

  /**
   * Mongo allows us to use selectors like `{"coauthorStatuses.userId": userId}`
   * (where `coauthorStatuses` is an array of JSONB) to match a record when any
   * item in the nested JSON matches the given scalar value. This requires special
   * handling in Postgres. This solution isn't particularly fast though - any
   * query that hits this code path would be a good place to consider writing some
   * better-optimized hand-rolled SQL.
   */
  private compileNonScalarArrayAccess(fieldName: string, path: string[], value: any): Atom<T>[] {
    path = path.map((element: string) => `'${element}'`);
    path.unshift("unnested");
    const last = path.pop();
    const selector = path.join("->") + "->>" + last;
    return [
      `(${this.prefixify("_id")} IN (SELECT _id FROM`,
      this.table,
      `, UNNEST("${fieldName}") unnested WHERE ${selector} =`,
      this.createArg(value),
      "))",
    ];
  }

  /**
   * Compile an arbitrary Mongo selector into an array of atoms.
   * `this.atoms` is not modified.
   */
  private compileComparison(fieldName: string, value: any): Atom<T>[] {
    let field: string;
    try {
      field = this.resolveFieldName(fieldName, value);
    } catch (e) {
      if (e instanceof NonScalarArrayAccessError) {
        return this.compileNonScalarArrayAccess(e.fieldName, e.path, value);
      } else {
        throw e;
      }
    }

    if (value === undefined) {
      return ["1=1"];
    }

    if (value === null) {
      return [`${field} IS NULL`];
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      if (keys.length > 1) {
        return this.compileMultiSelector(keys.map((key) => ({[fieldName]: {[key]: value[key]}})), "AND");
      }

      const comparer = keys[0];
      switch (comparer) {
        case "$not":
          return ["NOT (", ...this.compileComparison(fieldName, value[comparer]), ")"];

        case "$nin":
          return this.compileComparison(fieldName, {$not: {$in: value[comparer]}});

        case "$in":
        case "$all":
          if (!Array.isArray(value[comparer])) {
            throw new Error(`${comparer} expects an array`);
          }
          const fieldType = this.getField(fieldName)?.toConcrete();
          const hintType = fieldType?.isArray()
            ? fieldType.subtype
            : fieldType;
          const originalFieldTypeHint = this.getTypeHint(fieldType) ?? "";
          const hint = this.getTypeHint(hintType) ?? "";
          const args: (string | Arg)[] = value[comparer].length
            ? value[comparer].flatMap((item: any) => [
              ",", new Arg(item), hint,
            ]).slice(1)
            : [`SELECT NULL${hint}`];

          if (comparer === "$all") {
            return [field, "@> ARRAY[", ...args, "]"];
          }

          /**
           * For $in comparisons on array-typed fields.  Only tested with string arrays.
           * We use the original type hint, rather then subtype, because otherwise array fields will have the wrong hint
           * 
           * We use `&&` to do an intersection ("any values in the field match any values passed in") rather than "contains the entire subset"
           * As far as I can tell this case is only used for meetup types and we should avoid doing this elsewhere (and just hand-write some SQL)
           */
          if (fieldType?.isArray()) {
            return [field, originalFieldTypeHint, "&& ARRAY[", ...args, "]"]
          }

          /**
           * For all $in comparisons on regular (not array) fields, which is the overwhelming majority of them.
           */
          return [field, hint, "IN (", ...args, ")"];

        case "$exists":
          return [`${field} ${value["$exists"] ? "IS NOT NULL" : "IS NULL"}`];

        case "$size":
          const arraySize = value[comparer];
          if (typeof arraySize !== "number") {
            throw new Error(`Invalid array size: ${arraySize}`);
          }
          return [`ARRAY_LENGTH(${field}, 1) =`, new Arg(arraySize)];

        case "$geoWithin":
          // We can be very specific here because this is only used in a single place in the codebase;
          // when we search for events within a certain maximum distance of the user ("nearbyEvents"
          // in posts/view.ts).
          // When converting this to Postgres, we actually want the location in the form of a raw
          // longitude and latitude, which isn't the case for Mongo. To do this, we pass the selector
          // to the query builder manually here using $comment. This is a hack, but it's the only
          // place in the codebase where we use this operator so it's probably not worth spending a
          // ton of time making this beautiful.
          const {$centerSphere: center, $comment: { locationName }} = value[comparer];
          if (!center || !Array.isArray(center) || center.length !== 2 || !locationName) {
            throw new Error("Invalid $geoWithin selector");
          }
          const prefixedName = this.prefixify(locationName);
          const [lng, lat] = center[0];
          const distance = center[1];
          return [
            `(EARTH_DISTANCE(LL_TO_EARTH((${prefixedName}->>'lng')::FLOAT8, `,
            `(${prefixedName}->>'lat')::FLOAT8),`,
            "LL_TO_EARTH(",
            this.createArg(lng),
            ",",
            this.createArg(lat),
            ")) / 6378000) <", // Convert meters to radians, for mongo compat, 6378000 is the radius of the earth in meters
            this.createArg(distance),
          ];

        // `$near` is implemented by Mongo as a selector but it's actually a sort
        // operation. We handle it as a no-op here but save the value for later
        // use when we actually care about sorting.
        case "$near":
          const {$geometry: {type, coordinates}} = value[comparer];
          if (type !== "Point" ||
              typeof coordinates[0] !== "number" ||
              typeof coordinates[1] !== "number") {
            throw new Error("Invalid $near selector");
          }
          this.nearbySort = {
            field,
            lng: coordinates[0],
            lat: coordinates[1],
          };
          return ["1=1"];

        default:
          break;
      }

      const op = (comparisonOps as AnyBecauseTodo)[comparer];
      if (op) {
        return this.arrayify(fieldName, field, op, value[comparer]);
      } else {
        throw new Error(`Invalid comparison selector: ${field}: ${JSON.stringify(value)}`);
      }
    }

    return this.arrayify(fieldName, field, "=", value);
  }

  /**
   * Recursively merge logically combined selectors (such as $and or $or) into a flat
   * Atom array.
   */
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

  /**
   * Compile an arbitrary Mongo selector into an array of atoms.
   * `this.atoms` is not modified.
   */
  public compileSelector(selector: MongoSelector<T>): Atom<T>[] {
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

  /**
   * Compile the given selector and append it to `this.atoms`.
   */
  protected appendSelector(selector: MongoSelector<T>): void {
    this.atoms = this.atoms.concat(this.compileSelector(selector));
  }

  /**
   * Compile a conditional expression (used internally by `compileExpression` to handle
   * $cond statements).
   */
  private compileCondition(expr: any): Atom<T>[] {
    if (typeof expr === "string" && expr[0] === "$") {
      const name = expr.slice(1);
      return [this.resolveFieldName(name), "IS NOT NULL"];
    }
    if (typeof expr === "object" && expr) {
      const keys = Object.keys(expr);
      if (keys[0][0] && keys[0][0] !== "$") {
        return this.compileSelector(expr);
      }
    }
    return this.compileExpression(expr);
  }

  /**
   * Compile an arbitrary Mongo expression into an array of atoms.
   * `this.atoms` is not modified.
   */
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

    if ((arithmeticOps as AnyBecauseTodo)[op]) {
      const isMagnitude = isMagnitudeOp(op);
      const operands = expr[op].map((arg: any) => this.compileExpression(arg, isMagnitude ? 0 : undefined));
      const isDateDiff = op === "$subtract" && operands.length === 2 && operands.some(
        (arr: Atom<T>[]) => arr.some((atom) => atom instanceof Arg && atom.value instanceof Date)
      );
      let result: Atom<T>[] = [isDateDiff ? "(1000 * EXTRACT(EPOCH FROM" : "("];
      for (let i = 0; i < operands.length; i++) {
        if (i > 0) {
          result.push((arithmeticOps as AnyBecauseTodo)[op]);
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
    
    if (op === "$exp") {
      return ["EXP(", ...this.compileExpression(expr[op]), ")"];
    }

    if (op === "$sum") {
      return ["SUM(", ...this.compileExpression(expr[op]), ")"];
    }

    if ((variadicFunctions as AnyBecauseTodo)[op]) {
      const func = (variadicFunctions as AnyBecauseTodo)[op];
      const args = expr[op].map((value: any) => this.compileExpression(value));
      let prefix = `${func}(`;
      let result: Atom<T>[] = [];
      for (const arg of args) {
        result.push(prefix);
        result = result.concat(arg);
        prefix = ",";
      }
      result.push(")");
      return result;
    }

    if (op === "$in") {
      const [value, array] = expr[op];
      return [...this.compileExpression(array), "@> {", ...this.compileExpression(value), "}"];
    }

    // https://www.mongodb.com/docs/manual/reference/operator/aggregation/arrayElemAt/
    if (op === "$arrayElemAt") {
      const [array, index] = expr[op];
      // This is over specialized, but most of our usage follows this pattern
      if (typeof array === "string" && array[0] === "$") { // e.g. "$cats"
        // TODO: I think the logic inside this `if` is no longer used - can we
        // delete it?
        const tokens = array.split(".");
        const field = `"${tokens[0][0] === "$" ? tokens[0].slice(1) : tokens[0]}"`;
        const path = tokens.slice(1).flatMap((name) => ["->", `'${name}'`]);
        if (path.length) {
          path[path.length - 2] = "->>";
        }
        // Postgres array are 1-indexed
        return [`(${this.prefixify(field)})[1 + ${index}]${path.join("")}`];
      }
      return [
        "(",
        ...this.compileExpression(array),
        ")[ 1 +", // Postgres arrays are 1-indexed
        ...this.compileExpression(index),
        "]",
      ];
    }

    if (op === "$first") {
      return this.compileExpression(expr[op]);
    }

    if (op === "$floor") {
      return ["FLOOR(", ...this.compileExpression(expr[op]), ")"];
    }

    if (op === "$avg") {
      return ["AVG(", ...this.compileExpression(expr[op]), ")"];
    }

    // This is an operator that doesn't exist in Mongo that we need to add for
    // hacky reasons. In general, we can search correctly in arrays and we can
    // search correctly within JSON, however, we occassionaly have to search
    // inside arrays that exist deep inside a JSON object where we don't have
    // any schema available (for instance, pingbacks). Here we add a special
    // case that allows us to manually annotate these instances (see the
    // function `jsonArrayContainsSelector`) and generate the correct SQL.
    // This is rare, but is does occur.
    if (op === "$jsonArrayContains") {
      const [array, value] = expr[op];
      const [field, ...path] = array.split(".");
      return [
        this.resolveFieldName(field),
        "@> ('",
        ...this.buildJsonArrayAtPath(path, value),
        "')::JSONB",
      ];
    }

    if (op === undefined) {
      return ["'{}'::JSONB"];
    }

    throw new Error(`Invalid expression: ${JSON.stringify(expr)}`);
  }

  private buildJsonArrayAtPath(path: string[], value: any): Atom<T>[] {
    if (path.length) {
      const [name, ...rest] = path;
      return [
        `{ "${name}":`,
        ...this.buildJsonArrayAtPath(rest, value),
        "}",
      ];
    } else {
      return [
        "[\"' ||",
        ...this.compileExpression(value),
        "|| '\"]",
      ];
    }
  }
}

export function sanitizeSqlComment(comment: string): string {
  return comment.replace(/\n/g, '_');
}

export default Query;
