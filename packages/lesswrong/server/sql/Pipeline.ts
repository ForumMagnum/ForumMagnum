import Table from "./Table";
import SelectQuery, { Lookup } from "./SelectQuery";

/**
 * Unit is the method by which Pipeline (see below) decomposes complex
 * aggregations into simpler chunks that can be understood by the query
 * builder. In general, each Unit can accept one of each 'kind' of
 * aggregation operation. When a Pipeline attempts to add a second of a
 * particular 'kind' of operation, the Unit marks itself as full and
 * becomes a 'child' Unit of a newly created 'parent', which is returned.
 * When compiled, 'child' units become subqueries of their 'parents'.
 */
class Unit<T extends DbObject> {
  private empty = true;
  private addFields: any;
  private sort?: any;
  private limit?: number;
  private skip?: number;
  private selector?: any;
  private lookup?: any;
  private group?: any;
  private unwind?: string;
  private project?: MongoProjection<T>;
  private sampleSize?: number;

  constructor(private table: Table<T> | Unit<T>) {}

  isEmpty() {
    return this.empty;
  }

  toQuery(): AnyBecauseTodo {
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
        skip: this.skip,
        projection: this.project,
      },
      {
        addFields: this.addFields,
        lookup: this.lookup,
        group: this.group,
        unwind: this.unwind,
        sampleSize: this.sampleSize,
      },
    );
  }

  private addSimpleStage(name: string, data: any): Unit<T> {
    if ((this as AnyBecauseTodo)[name] || this.group) {
      const unit = new Unit(this);
      (unit as AnyBecauseTodo)[name] = data;
      unit.empty = false;
      return unit;
    } else {
      (this as AnyBecauseTodo)[name] = data;
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

  addSkipStage(data: number): Unit<T> {
    return this.addSimpleStage("skip", data);
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

  addSampleStage(data: any): Unit<T> {
    const size = data.size;
    if (typeof size !== "number" || size < 1) {
      throw new Error(`Invalid sample size: ${size}`);
    }
    return this.addSimpleStage("sampleSize", size);
  }
}

/**
 * Pipeline takes a Mongo aggregation pipeline and converts it into SQL by
 * recursively splitting it into smaller 'Units' (see above) which can be
 * understood by the query builder, and then nesting these Units together as
 * sub-queries.
 *
 * Only a limited subset of aggregation operators are implemented (although
 * adding more is often not too difficult). In general, Pipeline should be
 * seen as a temporary measure to quickly migrate Mongo aggregations to
 * Postgres that will eventually be rewritten in raw SQL, rather than as a
 * fool-proof, feature-packed aggregation compiler.
 */
class Pipeline<T extends DbObject> {
  constructor(
    private table: Table<T>,
    private stages: MongoAggregationPipeline<T> = [],
    private options?: MongoAggregationOptions, // TODO: What can options be?
    private sqlComment?: string
  ) {
  }

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
        case "$skip":      unit = unit.addSkipStage(data);      break;
        case "$lookup":    unit = unit.addLookupStage(data);    break;
        case "$project":   unit = unit.addProjectStage(data);   break;
        case "$group":     unit = unit.addGroupStage(data);     break;
        case "$unwind":    unit = unit.addUnwindStage(data);    break;
        case "$sample":    unit = unit.addSampleStage(data);    break;
        default:           throw new Error(`Invalid pipeline stage: ${name}`);
      }
    }

    return unit.toQuery();
  }

  getSqlComment() {
    return this.sqlComment;
  }

}

export default Pipeline;
