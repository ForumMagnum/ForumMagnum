import { CollationType, DEFAULT_COLLATION, getCollationType } from "./collation";

/**
 * TableIndex represents a named Postgres index on a particular group
 * of fields in a table. It may or may not be unique and/or partial.
 */
class TableIndex<T extends DbObject> {
  private fields: string[];
  private name: string;
  private collationType: CollationType = DEFAULT_COLLATION;

  constructor(
    private tableName: string,
    private key: MongoIndexKeyObj<T>,
    private options?: MongoEnsureIndexOptions<T>,
  ) {
    this.fields = Object.keys(key);
    this.name = options?.name
      ? "idx_" + options.name.replace(/\./g, "_")
      : `idx_${this.tableName}_${this.getSanitizedFieldNames().join("_")}`;
    if (options?.partialFilterExpression && !options.name) {
      this.name += "_filtered";
    }
    if (options?.collation) {
      this.collationType = getCollationType(options.collation);
      if (this.collationType === "case-insensitive") {
        this.name += "_ci";
      }
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

  createConcurrently() {
    return !!this.options?.concurrently;
  }

  isCaseInsensitive() {
    return this.collationType === "case-insensitive";
  }

  equals(fields: string[], options?: MongoEnsureIndexOptions<T>) {
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
    if (JSON.stringify(options?.partialFilterExpression) !== JSON.stringify(this.options?.partialFilterExpression)) {
      return false;
    }
    try {
      const collationType = getCollationType(options?.collation);
      if (collationType !== this.collationType) {
        return false;
      }
    } catch {
      if (this.collationType !== DEFAULT_COLLATION) {
        return false;
      }
    }
    return true;
  }

  equalsTableIndex(other: TableIndex<T>) {
    return this.equals(other.fields, other.options);
  }
}

export default TableIndex;
