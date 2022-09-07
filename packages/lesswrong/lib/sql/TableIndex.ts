class TableIndex {
  constructor(
    private tableName: string,
    private fields: string[],
    private options?: MongoEnsureIndexOptions, // TODO: What can options be?
  ) {}

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
      : `"idx_${this.tableName}_${this.getSanitizedFieldNames().join("_")}"`;
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
    return true;
  }
}

export default TableIndex;
