import { Vulcan, Collections } from '../vulcan-lib';

Vulcan.logMongoQueries = () => {
  let attachedAny = false;
  
  for(let i=0; i<Collections.length; i++)
  {
    let collection = Collections[i] as any;
    
    // `collection.before` may or may not be present. It is absent if either
    // this is a Vulcan special non-mongo collection (there are a couple of
    // those), or if we didn't load the matb33:collection-hooks library (which
    // is commented out by default).
    if (collection && collection.before) {
      attachedAny = true;
      collection.before.insert( (userId,doc) => {
        //eslint-disable-next-line no-console
        console.log(`${collection.collectionName}.insert(${JSON.stringify(doc)})`);
      });
      collection.before.update( (userId,doc,fieldNames,modifier,options) => {
        //eslint-disable-next-line no-console
        console.log(`${collection.collectionName}.update(${JSON.stringify(doc)}, ${JSON.stringify(fieldNames)}, ${JSON.stringify(modifier)}, ${JSON.stringify(options)})`);
      });
      collection.before.remove( (userId,doc) => {
        //eslint-disable-next-line no-console
        console.log(`${collection.collectionName}.remove(${JSON.stringify(doc)})`);
      });
      collection.before.upsert( (userId,selector,modifier,options) => {
        //eslint-disable-next-line no-console
        console.log(`${collection.collectionName}.upsert(${JSON.stringify(selector)}, ${JSON.stringify(modifier)}, ${JSON.stringify(options)})`);
      });
      collection.before.find( (userId,selector,options) => {
        //eslint-disable-next-line no-console
        console.log(`${collection.collectionName}.find(${JSON.stringify(selector)}, ${JSON.stringify(options)})`);
      });
      collection.before.findOne( (userId,selector,options) => {
        //eslint-disable-next-line no-console
        console.log(`${collection.collectionName}.findOne(${JSON.stringify(selector)}, ${JSON.stringify(options)})`);
      });
    }
  }
  
  if (!attachedAny) {
    //eslint-disable-next-line no-console
    console.log("Did not attach any loggers. To use this function, first uncomment the matb33:collection-hooks package in .meteor/packages");
  }
}
