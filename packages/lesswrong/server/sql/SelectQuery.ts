import Query, { Atom, sanitizeSqlComment } from "./Query";
import Table from "./Table";
import { DefaultValueType, IdType, NotNullType, Type, UnknownType } from "./Type";
import { tableNameToCollectionName } from "@/lib/generated/collectionTypeNames";
import { inspect } from "util";
import { getCollationType } from "./collation";

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

/**
 * The Mongo $lookup aggregation stage supports two different argument signatures,
 * which we've called the `SimpleLookup` and the `PipelineLookup` (see above).
 * `SimpleLookups` are fairly trivial to convert into SQL, so we compile them
 * automatically, but `PipelineLookups` are much more complex. If the caller tries
 * to use a `PipelineLookup`, we just throw an error - they should manually rewrite
 * the aggregation in SQL instead.
 */
export type Lookup = SimpleLookup | PipelineLookup;

export type SelectSqlOptions = Partial<{
  /**
   * Set the maximum number of records that can be returned.
   */
  count: boolean,
  /**
   * Defined extra syntheticFields using Mongo syntax - these can be arbitrarily
   * complex expressions and have full access to the current scope.
   */
  addFields: any // TODO typing
  /**
   * Perform a Mongo aggregation $lookup. This is similar to a join, but actually
   * has quite a different output format which is actually implemented using
   * Postgres' `LATERAL` statement in combination with `jsonb_agg()`.
   */
  lookup: Lookup,
  /**
   * Perform a Mongo aggregation $unwind which works like Postgres' `unnest`.
   */
  unwind: any, // TODO typing
  /**
   * This provides a hook for the called to insert a raw SQL string into the query,
   * in a suitable position for a join (for example usage, see server/recommendations.ts).
   */
  joinHook: string,
  /**
   * Select for an atomic update.
   */
  forUpdate: boolean,
  /**
   * Perform a Mongo aggregation $group, which is translated to a Postgres `GROUP BY`.
   * Because this emulates Mongo's behaviour, the fields defined here also act as an
   * implicit projection. It will also overwrite the selectors - to use a selector use
   * a combination of $match and $group stages in a pipeline rather than using this
   * directly.
   */
  group: Record<string, any>, // TODO Better typing
  /**
   * Perform a Mongo $sample aggregation where we select `sampleSize` random elements
   * from the result.
   */
  sampleSize: number,
  /**
   * Don't initialize the query in the constructor (this is used by
   * `SelectFragmentQuery` to insert a custom projection without the normal "*"
   * projection that `SelectQuery` would generate).
   */
  deferInit: boolean,
  /**
   * Table prefix for the primary table (used by `SelectFragmentQuery` for
   * custom projections).
   */
  primaryPrefix?: string,
}>

/**
 * Grouping with aggregation expressions is a little unintuative in Postgres as we need
 * to _exclude_ the aggregated field from the GROUP BY clause (for example, `SELECT id,
 * SUM(amount) AS amount FROM yourtable GROUP BY id`). This function decides which fields
 * are to be excluded.
 */
export const isGroupByAggregateExpression = (value: any) => {
  switch (typeof value) {
    case "string":
      return false;
    case "object":
      if (!value || Object.keys(value)[0] === "$first") {
        return false;
      }
      return true;
    default:
      throw new Error(`Invalid group-by value: ${inspect(value)}`);
  }
}

/**
 * Builds a Postgres query to select some specific data from the given table.
 *
 * More complex queries can also be constructed here my making use of the
 * `sqlOptions` argument which mainly exists to facilitate aggregation pipelines,
 * but can also be used explicitely. See SelectSqlOptions for details.
 */
class SelectQuery<T extends DbObject> extends Query<T> {
  private hasLateralJoin = false;
  protected sqlComment: string|null

  constructor(
    table: Table<T> | Query<T>,
    selector?: string | MongoSelector<T>,
    options?: MongoFindOptions<T>,
    sqlOptions?: SelectSqlOptions,
  ) {
    const deferInit = sqlOptions?.deferInit ?? false;
    const primaryPrefix = sqlOptions?.primaryPrefix ?? null;
    super(table, deferInit ? [] : ["SELECT"], primaryPrefix);

    if (options?.collation) {
      const collation = getCollationType(options.collation);
      this.isCaseInsensitive = collation === "case-insensitive";
    }

    if (sqlOptions?.group) {
      this.appendGroup(sqlOptions.group);
      return;
    }

    if (options?.comment) {
      this.sqlComment = sanitizeSqlComment(options.comment);
    }

    if (!deferInit) {
      this.initOptions(table, options, sqlOptions);
      this.initSelector(selector, options, sqlOptions);
    }
  }

  private initOptions(
    table: Table<T> | Query<T>,
    options?: MongoFindOptions<T>,
    sqlOptions?: SelectSqlOptions,
  ) {
    this.hasLateralJoin = !!sqlOptions?.lookup;

    const {addFields, projection} = this.disambiguateSyntheticFields(sqlOptions?.addFields, options?.projection);
    this.atoms = this.atoms.concat(this.getProjectedFields(table, sqlOptions?.count, projection));
    if (addFields) {
      this.atoms = this.atoms.concat(this.getSyntheticFields(addFields));
    }
    this.atoms = this.atoms.concat(["FROM", table]);

    if (sqlOptions?.lookup) {
      this.appendLateralJoin(sqlOptions.lookup);
    }

    if (sqlOptions?.joinHook) {
      this.atoms.push(sqlOptions.joinHook);
    }
  }

  protected initSelector(
    selector?: string | MongoSelector<T>,
    options?: MongoFindOptions<T>,
    sqlOptions?: SelectSqlOptions,
  ) {
    if (typeof selector === "string") {
      selector = {_id: selector};
    }

    if (!this.selectorIsEmpty(selector)) {
      this.atoms.push("WHERE");
      this.appendSelector(selector);
    }

    if (options || this.nearbySort) {
      this.appendOptions(options ?? {}, sqlOptions?.sampleSize);
    }

    if (sqlOptions?.forUpdate) {
      this.atoms.push("FOR UPDATE");
    }
  }

  getSqlComment() {
    return this.sqlComment;
  }

  private selectorIsEmpty(selector?: string | MongoSelector<T>): boolean {
    if (!selector) {
      return true;
    }

    if (typeof selector === "string") {
      return false;
    }

    const keys = Object.keys(selector);
    return keys.length === 1
      ? keys[0] === "$comment"
      : keys.length === 0;
  }

  private appendGroup<U extends {}>(group: U) {
    this.atoms = this.atoms.concat(this.getProjectedFields(this.table, undefined, group, false));
    this.atoms = this.atoms.concat(["FROM", this.table, "GROUP BY"]);
    const keys = Object.keys(group).filter((key: string) => !isGroupByAggregateExpression((group as AnyBecauseTodo)[key]));
    const fields = keys.map((key) =>
      `"${typeof (group as AnyBecauseTodo)[key] === "string" && (group as AnyBecauseTodo)[key][0] === "$" ? (group as AnyBecauseTodo)[key].slice(1) : key}"`
    );
    this.atoms.push(fields.map((f) => this.prefixify(f)).join(", "));
  }

  private getStarSelector() {
    return this.table instanceof Table && !this.hasLateralJoin
      ? `"${this.table.getName()}".*`
      : "*";
  }

  private appendLateralJoin(lookup: Lookup): void {
    const {from, as} = lookup;
    if (!from || !as) {
      throw new Error("Invalid $lookup");
    }

    if (!(from in tableNameToCollectionName)) {
      throw new Error(`Invalid $lookup: ${from} is not a valid table name`);
    }

    if ("localField" in lookup && "foreignField" in lookup) {
      const {localField, foreignField} = lookup;
      const table = tableNameToCollectionName[from as keyof typeof tableNameToCollectionName];
      this.atoms.push(`, LATERAL (SELECT jsonb_agg("${table}".*) AS "${as}" FROM "${table}" WHERE`);
      this.atoms.push(`${this.resolveTableName()}"${localField}" = "${table}"."${foreignField}") Q`);
      this.syntheticFields[as] = new UnknownType();
    } else if ("let" in lookup && "pipeline" in lookup) {
      throw new Error("Pipeline joins are not implemented - write raw SQL");
    } else {
      throw new Error("Invalid $lookup");
    }
  }

  protected getSyntheticFields(addFields: Record<string, any>, leadingComma = true): Atom<T>[] {
    for (const field in addFields) {
      this.syntheticFields[field] = new UnknownType();
    }
    return Object.keys(addFields).flatMap((field) =>
      [",", ...this.compileExpression(addFields[field]), "AS", `"${field}"`]
    ).slice(leadingComma ? 0 : 1);
  }

  protected disambiguateSyntheticFields(addFields?: any, projection?: MongoProjection<T>) {
    if (addFields) {
      const fields = Object.keys(addFields);
      for (const field of fields) {
        const existingType = this.table.getField(field);
        if (existingType) {
          if (!projection) {
            projection = {};
          }
          (projection as AnyBecauseTodo)[field] = 0;
        }
      }
    }
    return {addFields, projection};
  }

  private getProjectedFields(
    table: Table<T> | Query<T>,
    count?: boolean,
    projection?: MongoProjection<T>,
    autoIncludeId = true,
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
      if ((projection as AnyBecauseTodo)[key]) {
        if (["object", "string"].includes(typeof (projection as AnyBecauseTodo)[key])) {
          addFields[key] = (projection as AnyBecauseTodo)[key];
        } else {
          include.push(key);
        }
      } else {
        exclude.push(key);
      }
    }

    if (
      this.table instanceof SelectQuery &&
      (!this.table.syntheticFields._id || projection._id)
    ) {
      autoIncludeId = false;
    }

    let fields: string[] = [this.getStarSelector()];
    if (include.length && !exclude.length) {
      if (autoIncludeId && !include.includes("_id")) {
        include.push("_id");
        this.syntheticFields._id = new IdType();
      }
      fields = include;
    } else if (exclude.length && !include.length) {
      fields = Object.keys(table.getFields()).filter((field) => !exclude.includes(field));
    } else if (include.length && exclude.length) {
      if (autoIncludeId && !include.includes("_id") && !exclude.includes("_id")) {
        include.push("_id");
        this.syntheticFields._id = new IdType();
      }
      fields = include;
    } else if (autoIncludeId) {
      this.syntheticFields._id = new IdType();
    } else {
      fields = [];
    }

    const compiledFields = fields.map((field) => field.indexOf("*") > -1 ? field : `"${field}"`).join(", ");
    let projectedAtoms: Atom<T>[] = compiledFields ? [compiledFields] : [];
    if (Object.keys(addFields).length) {
      projectedAtoms = projectedAtoms.concat(this.getSyntheticFields(addFields, !!projectedAtoms.length));
    }
    return projectedAtoms;
  }

  private appendOptions(options: MongoFindOptions<T>, sampleSize?: number): void {
    const {sort, limit, skip} = options;

    if (sort && Object.keys(sort).length) {
      this.atoms.push("ORDER BY");
      const sorts: string[] = [];
      for (const field in sort) {
        const fieldType = this.table.getField(field)
        const fieldIsNonnull =
          (fieldType instanceof NotNullType)
          || (fieldType instanceof DefaultValueType && fieldType.isNotNull());
        const pgSorting =
          (sort[field] === 1 ? "ASC" : "DESC")
          + (fieldIsNonnull
              ? "" : (sort[field] === 1 ? " NULLS FIRST" : " NULLS LAST"))
        sorts.push(`${this.resolveFieldName(field)} ${pgSorting}`);
      }
      this.atoms.push(sorts.join(", "));
    } else if (this.nearbySort) { // Nearby sort is overriden by a sort in `options`
      // Field has already been resolved and prefixified by Query.compileComparison
      const {field, lng, lat} = this.nearbySort;
      this.atoms = this.atoms.concat([
        "ORDER BY EARTH_DISTANCE(LL_TO_EARTH((",
        field,
        "->'coordinates'->0)::FLOAT8, (",
        field,
        "->'coordinates'->1)::FLOAT8), LL_TO_EARTH(",
        this.createArg(lng),
        ",",
        this.createArg(lat),
        ")) ASC NULLS LAST",
      ]);
    }

    if (limit) {
      this.atoms.push("LIMIT");
      this.atoms.push(this.createArg(limit));
    }

    if (sampleSize) {
      if (sort || this.nearbySort || limit) {
        throw new Error("Conflicting sort options for select query");
      }
      this.atoms.push("ORDER BY RANDOM() LIMIT");
      this.atoms.push(this.createArg(sampleSize));
    }

    if (skip) {
      this.atoms.push("OFFSET");
      this.atoms.push(this.createArg(skip));
    }
  }
}

export default SelectQuery;
