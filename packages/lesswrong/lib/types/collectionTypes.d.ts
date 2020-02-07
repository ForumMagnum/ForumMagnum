
interface CollectionBase {
  collectionName: string
  options: any
  
  addDefaultView: any
  addView: any
  views: any
  
  rawCollection: any
  checkAccess: any
  find: any
  findOne: any
  update: any
  remove: any
}

// Common base type for everything that has an _id field (including both raw DB
// objects and fragment-resolver results).
interface HasIdType {
  _id: string
}

// Common base type for results of database lookups.
interface DbObject extends HasIdType {
  schemaVersion: number
}
