import Query from "./Query";
import Table from "./Table";
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
}>

class SelectQuery<T extends DbObject> extends Query<T> {
  constructor(
    table: Table | Query<T>,
    selector?: string | MongoSelector<T>,
    options?: MongoFindOptions<T>,
    sqlOptions?: SelectSqlOptions,
  ) {
    if (typeof selector === "string") {
      selector = {_id: selector};
    }

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
}

export default SelectQuery;
