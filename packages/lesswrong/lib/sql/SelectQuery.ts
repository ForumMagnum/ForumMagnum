import Query, { Atom } from "./Query";
import Table from "./Table";
import { UnknownType } from "./Type";
import { getCollectionByTableName } from "../vulcan-lib";

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
  forUpdate: boolean,
}>

class SelectQuery<T extends DbObject> extends Query<T> {
  private hasLateralJoin: boolean = false;

  constructor(
    table: Table | Query<T>,
    selector?: string | MongoSelector<T>,
    options?: MongoFindOptions<T>,
    sqlOptions?: SelectSqlOptions,
  ) {
    super(table, ["SELECT"]);
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
    } else if ("let" in lookup && "pipeline" in lookup) {
      throw new Error("Pipeline joins are not being implemented - write raw SQL");
    } else {
      throw new Error("Invalid $lookup");
    }
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
      this.atoms.push(this.createArg(limit));
    }

    if (skip) {
      this.atoms.push("OFFSET");
      this.atoms.push(this.createArg(skip));
    }
  }
}

export default SelectQuery;
