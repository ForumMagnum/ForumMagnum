//
// Usage: mongo <database-URI> printIndexes.js
//
// This runs in a MongoDB context, not a regular Node context. Print a list of
// indexes on a database. Filters out primary key indexes and fields that you
// don't need for writing _ensureIndexes calls.
//
// The result is close to being ready-to-execute Javascript code, but not
// quite. In particular
//  * You'll need to figure out the correct import statements for the collections
//  * The collection names aren't capitalized correctly, because mongo table names
//    are all-lowercase.
//  * Some of the collections are Meteor internal, and may be tricky to get a
//    collection object for.
//

// "db" is defined because this runs in a mongo shell.
let lw2db = db.getSiblingDB('lesswrong2'); // eslint-disable-line no-undef

// Return true if the given index is a vanilla primary-key index with no extra
// options.
function isPrimaryKeyIndex(index) {
  if(JSON.stringify(index.key) !== '{"_id":1}')
    return false;
  if(Object.keys(getIndexOptions(index)).length > 0)
    return false;

  return true;
}

// Return the options for an index, ie, all fields other than key, name, ns, and v.
function getIndexOptions(index) {
  let excludedFields = ["key","v","ns","name"];
  let options = {};
  for(let k in index) {
    if(excludedFields.indexOf(k) == -1) {
      options[k] = index[k];
    }
  }
  return options;
}

function describeIndex(collectionName, index) {
  // For the _ensureIndex call, the first argument is `key` and the second
  // argument is everything that was on the index description except for
  // key, v, ns, and name.
  let options = getIndexOptions(index);
  let hasOptions = (Object.keys(options).length > 0);

  if(hasOptions)
    return `${collectionName}._ensureIndex(${JSON.stringify(index.key)}, ${JSON.stringify(options)});`;
  else
    return `${collectionName}._ensureIndex(${JSON.stringify(index.key)});`;
}

function getIndexStats(index, indexStats)
{
  if(!indexStats) return null;
  let indexName = index.name;
  for(let i=0; i<indexStats.length; i++) {
    if(indexStats[i].name === indexName)
      return indexStats[i];
  }
  print("// Failed to find index statistics for "+indexName);
  return null;
}

function indexIsUnused(indexStats)
{
  if(!indexStats)
    return false;
  if(!indexStats.accesses || !indexStats.accesses.ops)
    return false;
  return indexStats.accesses.ops.valueOf() === 0;
}

lw2db.getCollectionNames().forEach(collection => {
  let indexes = lw2db[collection].getIndexes()
    .filter(index => !isPrimaryKeyIndex(index));

  if(indexes.length > 0) {
    let indexStats = null;
    try {
      indexStats = lw2db[collection].aggregate([{$indexStats: {}}]).toArray();
    } catch(e) {
      print("Unable to get index statistics: "+e);
    }
    if(!(indexStats.length > 0))
      print("No index statistics retrieved");
    
    print(`// ${collection}`);
    indexes.forEach(index => {
      let stats = getIndexStats(index, indexStats);
      
      if(indexIsUnused(stats)) {
        print(`// UNUSED: ${describeIndex(collection, index)}`);
      } else {
        print(describeIndex(collection, index));
      }
    });
    print("");
  }
}) 
