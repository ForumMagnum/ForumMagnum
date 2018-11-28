import { Collections } from 'meteor/vulcan:lib';

Vulcan.logMongoQueries = () => {
  for(let i=0; i<Collections.length; i++)
  {
    let collection = Collections[i];
    if (collection && collection.before) {
      collection.before.insert( (userId,doc) => {
        console.log(`${collection.collectionName}.insert(${JSON.stringify(doc)})`);
      });
      collection.before.update( (userId,doc,fieldNames,modifier,options) => {
        console.log(`${collection.collectionName}.update(${JSON.stringify(doc)}, ${JSON.stringify(fieldNames)}, ${JSON.stringify(modifier)}, ${JSON.stringify(options)})`);
      });
      collection.before.remove( (userId,doc) => {
        console.log(`${collection.collectionName}.remove(${JSON.stringify(doc)})`);
      });
      collection.before.upsert( (userId,selector,modifier,options) => {
        console.log(`${collection.collectionName}.upsert(${JSON.stringify(selector)}, ${JSON.stringify(modifier)}, ${JSON.stringify(options)})`);
      });
      collection.before.find( (userId,selector,options) => {
        console.log(`${collection.collectionName}.find(${JSON.stringify(selector)}, ${JSON.stringify(options)})`);
      });
      collection.before.findOne( (userId,selector,options) => {
        console.log(`${collection.collectionName}.findOne(${JSON.stringify(selector)}, ${JSON.stringify(options)})`);
      });
    }
  }
}