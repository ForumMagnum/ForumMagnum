export type CustomPgIndexOptions = {
  dependencies?: SchemaDependency[],
}

export type CustomPgIndex = {
  source: string,
  options?: CustomPgIndexOptions,
}

export class DatabaseIndexSet {
  mongoStyleIndexes: Partial<Record<CollectionNameString, Array<MongoIndexSpecification<any>>>> = {}
  customPgIndexes: CustomPgIndex[] = [];

  addIndex(collectionName: CollectionNameString, index: any, options: any={}) {
    if (!this.mongoStyleIndexes[collectionName]) {
      this.mongoStyleIndexes[collectionName] = [];
    }
    this.mongoStyleIndexes[collectionName]!.push({
      ...options,
      key: index,
    });
  }
  
  addCustomPgIndex(source: string, options?: CustomPgIndexOptions) {
    this.customPgIndexes.push({source, options});
  }
}

export function mergeDatabaseIndexSets(indexSets: DatabaseIndexSet[]): DatabaseIndexSet {
  const merged = new DatabaseIndexSet();
  for (const indexSet of indexSets) {
    for (const collectionName of Object.keys(indexSet.mongoStyleIndexes) as CollectionNameString[]) {
      for (const mongoStyleIndex of indexSet.mongoStyleIndexes[collectionName] ?? []) {
        merged.addIndex(collectionName, mongoStyleIndex);
      }
    }
    for (const customPgIndex of indexSet.customPgIndexes) {
      merged.addCustomPgIndex(customPgIndex.source, customPgIndex.options);
    }
  }
  return merged;
}
