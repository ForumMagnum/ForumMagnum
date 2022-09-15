import Table from "./Table";
import SelectQuery, { Lookup } from "./SelectQuery";

class Unit<T extends DbObject> {
  private empty = true;
  private addFields: any;
  private sort?: any;
  private limit?: number;
  private selector?: any;
  private lookup?: any;
  private group?: any;
  private unwind?: string;
  private project?: MongoProjection<T>;

  constructor(private table: Table | Unit<T>) {}

  isEmpty() {
    return this.empty;
  }

  toQuery() {
    if (this.empty) {
      if (this.table instanceof Table) {
        throw new Error("Can't convert empty pipeline to query");
      }
      return this.table.toQuery();
    }
    return new SelectQuery<T>(
      this.table instanceof Unit ? this.table.toQuery() : this.table,
      this.selector ?? {},
      {
        sort: this.sort,
        limit: this.limit,
        projection: this.project,
      },
      {
        addFields: this.addFields,
        lookup: this.lookup,
        group: this.group,
        unwind: this.unwind,
      },
    );
  }

  private addSimpleStage(name: string, data: any): Unit<T> {
    if (this[name] || this.group) {
      const unit = new Unit(this);
      unit[name] = data;
      unit.empty = false;
      return unit;
    } else {
      this[name] = data;
      this.empty = false;
      return this;
    }
  }

  addMatchStage(data: any): Unit<T> {
    return this.addSimpleStage("selector", data);
  }

  addAddFieldsStage(data: any): Unit<T> {
    return this.addSimpleStage("addFields", data);
  }

  addSortStage(data: any): Unit<T> {
    return this.addSimpleStage("sort", data);
  }

  addLimitStage(data: number): Unit<T> {
    return this.addSimpleStage("limit", data);
  }

  addLookupStage(data: Lookup): Unit<T> {
    return this.addSimpleStage("lookup", data);
  }

  addProjectStage(data: any): Unit<T> {
    return this.addSimpleStage("project", data);
  }

  addGroupStage(data: any): Unit<T> {
    const unit: Unit<T> = this.empty ? this : new Unit(this);
    unit.group = data;
    unit.empty = false;
    return unit;
  }

  addUnwindStage(data: any): Unit<T> {
    // TODO
    throw new Error("$unwind not yet implemented");
  }
}

class Pipeline<T extends DbObject> {
  constructor(
    private table: Table,
    private stages: MongoAggregationPipeline<T> = [],
    private options?: MongoAggregationOptions, // TODO: What can options be?
  ) {}

  compile(): {sql: string, args: any[]} {
    return this.toQuery().compile();
  }

  toQuery(): SelectQuery<T> {
    let unit = new Unit<T>(this.table);

    for (const stage of this.stages) {
      const keys = Object.keys(stage);
      if (keys.length !== 1) {
        throw new Error("Invalid pipeline stage format");
      }
      const name = keys[0];
      const data = stage[name];
      switch (name) {
        case "$match":     unit = unit.addMatchStage(data);     break;
        case "$addFields": unit = unit.addAddFieldsStage(data); break;
        case "$sort":      unit = unit.addSortStage(data);      break;
        case "$limit":     unit = unit.addLimitStage(data);     break;
        case "$lookup":    unit = unit.addLookupStage(data);    break;
        case "$project":   unit = unit.addProjectStage(data);   break;
        case "$group":     unit = unit.addGroupStage(data);     break;
        case "$unwind":    unit = unit.addUnwindStage(data);    break;
        default:           throw new Error(`Invalid pipeline stage: ${name}`);
      }
    }

    return unit.toQuery();
  }
}

export default Pipeline;
