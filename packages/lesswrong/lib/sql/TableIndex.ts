/**
 * TableIndex represents a named Postgres index on a particular group
 * of fields in a table. It may or may not be unique and/or partial.
 */
class TableIndex {
  private name: string;

  constructor(
    private tableName: string,
    private fields: string[],
    private options?: MongoEnsureIndexOptions,
  ) {
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

  // TODO: This is lossy and may lead to collisions
  private getSanitizedFieldNames() {
    return this.fields.map((field) => {
      const index = field.indexOf(".");
      return index >= 0 ? field.slice(0, index) : field;
    });
  }

  getName() {
    return this.name;
  }

  getDetails() {
    return {
      v: 2, // To match Mongo's output
      key: this.fields,
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
}

export default TableIndex;
