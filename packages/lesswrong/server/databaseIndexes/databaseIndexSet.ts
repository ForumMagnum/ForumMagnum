import { CustomPgIndex, CustomPgIndexOptions } from "@/lib/collectionIndexUtils";

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
