import Query, { Atom } from "./Query";
import Table from "./Table";
import { UnknownType } from "./Type";
import { getCollectionByTableName } from "../vulcan-lib/getCollection";

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
   */
  group: any, // TODO typing
}>

const isAggregate = (value: any) => {
  switch (typeof value) {
    case "string":
      return false;
    case "object":
      if (!value || Object.keys(value)[0] === "$first") {
        return false;
      }
      return true;
    default:
      return true;
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

  constructor(
    table: Table | Query<T>,
    selector?: string | MongoSelector<T>,
    options?: MongoFindOptions<T>,
    sqlOptions?: SelectSqlOptions,
  ) {
    super(table, ["SELECT"]);

    if (sqlOptions?.group) {
      this.appendGroup(sqlOptions.group);
      return;
    }

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

    if (typeof selector === "string") {
      selector = {_id: selector};
    }

    if (selector && Object.keys(selector).length > 0) {
      this.atoms.push("WHERE");
      this.appendSelector(selector);
    }

    if (options) {
      if (options.collation) {
        throw new Error("Collation not yet implemented")
      }
      this.appendOptions(options);
    }

    if (sqlOptions?.forUpdate) {
      this.atoms.push("FOR UPDATE");
    }
  }

  private appendGroup<U extends {}>(group: U) {
    this.atoms = this.atoms.concat(this.getProjectedFields(this.table, undefined, group, false));
    this.atoms = this.atoms.concat(["FROM", this.table, "GROUP BY"]);
    const keys = Object.keys(group).filter((key: string) => !isAggregate(group[key]));
    const fields = keys.map((key) =>
      `"${typeof group[key] === "string" && group[key][0] === "$" ? group[key].slice(1) : key}"`
    );
    this.atoms.push(fields.join(", "));
  }

  private getStarSelector() {
    return this.table instanceof Table && !this.hasLateralJoin ? `"${this.table.getName()}".*` : "*";
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
      this.syntheticFields[as] = new UnknownType();
    } else if ("let" in lookup && "pipeline" in lookup) {
      throw new Error("Pipeline joins are not being implemented - write raw SQL");
    } else {
      throw new Error("Invalid $lookup");
    }
  }

  private getSyntheticFields(addFields: Record<string, any>, leadingComma = true): Atom<T>[] {
    for (const field in addFields) {
      this.syntheticFields[field] = new UnknownType();
    }
    return Object.keys(addFields).flatMap((field) =>
      [",", ...this.compileExpression(addFields[field]), "AS", `"${field}"`]
    ).slice(leadingComma ? 0 : 1);
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

  private getProjectedFields(
    table: Table | Query<T>,
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
      if (projection[key]) {
        if (["object", "string"].includes(typeof projection[key])) {
          addFields[key] = projection[key];
        } else {
          include.push(key);
        }
      } else {
        exclude.push(key);
      }
    }

    if (this.table instanceof SelectQuery && !this.table.syntheticFields._id) {
      // TODO: I think there are some aggregations where this prevents a SQL error
      // with multiple ambiguous _id fields, but it also causing some other things
      // to break (aggregation with multiple layers of $project lose their id). Work
      // out if this original issue still exists or if this can be removed. If it
      // still exists, I probably need to find a better solution...
      // autoIncludeId = false;
    }

    let fields: string[] = [this.getStarSelector()];
    if (include.length && !exclude.length) {
      if (autoIncludeId && !include.includes("_id")) {
        include.push("_id");
      }
      fields = include;
    } else if (exclude.length && !include.length) {
      fields = Object.keys(table.getFields()).filter((field) => !exclude.includes(field));
    } else if (include.length && exclude.length) {
      if (autoIncludeId && !include.includes("_id") && !exclude.includes("_id")) {
        include.push("_id");
      }
      fields = include;
    } else if (!autoIncludeId) {
      fields = [];
    }

    const compiledFields = fields.map((field) => field.indexOf("*") > -1 ? field : `"${field}"`).join(", ");
    let projectedAtoms: Atom<T>[] = compiledFields ? [compiledFields] : [];
    if (Object.keys(addFields).length) {
      projectedAtoms = projectedAtoms.concat(this.getSyntheticFields(addFields, !!projectedAtoms.length));
    }
    return projectedAtoms;
  }

  private appendOptions(options: MongoFindOptions<T>): void {
    const {sort, limit, skip} = options;

    if (sort && Object.keys(sort).length) {
      this.atoms.push("ORDER BY");
      const sorts: string[] = [];
      for (const field in sort) {
        sorts.push(`${this.resolveFieldName(field)} ${sort[field] === 1 ? "ASC" : "DESC"}`);
      }
      this.atoms.push(sorts.join(", "));
    }

    if (limit) {
      this.atoms.push("LIMIT");
      this.atoms.push(this.createArg(limit));
    }

    if (skip) {
      this.atoms.push("OFFSET");
      this.atoms.push(this.createArg(skip));
    }
  }
}

export default SelectQuery;
