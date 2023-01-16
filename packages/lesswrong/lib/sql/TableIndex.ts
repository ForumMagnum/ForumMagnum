/**
 * TableIndex represents a named Postgres index on a particular group
 * of fields in a table. It may or may not be unique and/or partial.
 */
class TableIndex {
  private fields: string[];
  private name: string;

  constructor(
    private tableName: string,
    private key: Record<string, 1 | -1>,
    private options?: MongoEnsureIndexOptions,
  ) {
    this.fields = Object.keys(key);
    this.name = options?.name
      ? "idx_" + options.name.replace(/\./g, "_")
      : `idx_${this.tableName}_${this.getSanitizedFieldNames().join("_")}`;
    if (options?.partialFilterExpression && !options.name) {
      this.name += "_filtered";
    }
  }

  getFields() {
    return this.fields;
  }

  private getSanitizedFieldNames() {
    return this.fields.map((field) => field.replace(/\./g, "__"));
  }

  getName() {
    return this.name;
  }

  getDetails() {
    return {
      v: 2, // To match Mongo's output
      key: this.key,
      ...this.options,
    };
  }

  getPartialFilterExpression() {
    return this.options?.partialFilterExpression;
  }

  isUnique() {
    return !!this.options?.unique;
  }

  equals(fields: string[], options?: MongoEnsureIndexOptions) {
    if (this.fields.length !== fields.length) {
      return false;
    }
    for (let i = 0; i < this.fields.length; ++i) {
      if (this.fields[i] !== fields[i]) {
        return false;
      }
    }
    if (options?.unique !== this.options?.unique) {
      return false;
    }
    if (options?.partialFilterExpression !== this.options?.partialFilterExpression) {
      return false;
    }
    return true;
  }

  equalsTableIndex(other: TableIndex) {
    return this.equals(other.fields, other.options);
  }
}

export default TableIndex;
