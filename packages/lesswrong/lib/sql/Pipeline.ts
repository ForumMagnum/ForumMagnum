import Table from "./Table";
import Query, { SelectFieldSpec, Lookup } from "./Query";

class Unit<T extends DbObject> {
  private fields?: SelectFieldSpec[];
  private sort?: any;
  private limit?: number;
  private selector?: any;
  private lookup?: any;
  private unwind?: string;

  constructor(private table: Table | Unit<T>) {}

  toQuery(): Query<T> {
    return Query.select(
      this.table instanceof Unit ? this.table.toQuery() : this.table,
      this.selector ?? {},
      {
        sort: this.sort,
        limit: this.limit,
      },
      {
        fields: this.fields,
        lookup: this.lookup,
        unwind: this.unwind,
      },
    );
  }

  private addSimpleStage(name: string, data: any): Unit<T> {
    if (this[name]) {
      const unit = new Unit(this);
      unit[name] = data;
      return unit;
    } else {
      this[name] = data;
      return this;
    }
  }

  addMatchStage(data: any): Unit<T> {
    return this.addSimpleStage("selector", data);
  }

  addAddFieldsStage(data: any): Unit<T> {
    return this.addSimpleStage("fields", data);
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
    // TODO
    // throw new Error("$project not yet implemented");
    return this;
  }

  addUnwindStage(data: any): Unit<T> {
    // TODO
    // throw new Error("$unwind not yet implemented");
    return this;
  }
}

class Pipeline<T extends DbObject> {
  constructor(
    private table: Table,
    private stages: any[] = [],
    private options?: any,
  ) {}

  compile(): {sql: string, args: any[]} {
    return this.toQuery().compile();
  }

  toQuery(): Query<T> {
    let unit = new Unit(this.table);

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
        case "$unwind":    unit = unit.addUnwindStage(data);    break;
        default:           throw new Error(`Invalid pipeline stage: ${name}`);
      }
    }

    return unit.toQuery();
  }
}

export default Pipeline;
