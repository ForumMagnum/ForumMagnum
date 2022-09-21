class TableIndex {
  constructor(
    private tableName: string,
    private fields: string[],
    private options?: MongoEnsureIndexOptions,
  ) {
    if (options?.partialFilterExpression) {
      // eslint-disable-next-line no-console
      console.warn("partialFilterExpression not supported", tableName, fields, options);
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
    return this.options?.name
      ? "idx_" + this.options.name.replace(/\./g, "_")
      : `idx_${this.tableName}_${this.getSanitizedFieldNames().join("_")}`;
  }

  getDetails() {
    return {
      v: 2,
      key: this.fields,
      ...this.options,
    };
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
