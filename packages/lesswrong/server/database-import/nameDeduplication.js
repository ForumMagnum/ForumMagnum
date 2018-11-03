// To be run by copy and pasting into mongodb
var bulk = db.users.initializeOrderedBulkOp();
var count = 0;
var aggUsers = db.users.aggregate([
  {$match: {username: /_duplicate/}},
  { "$project": {
      "newDisplayname": '$username',
    }}
])
var updatedUsers = aggUsers.forEach(function(doc) {
  printjson(doc)
  newDisplayname = doc.newDisplayname.replace(/_duplicate.*/, '')
  bulk.find({'_id': doc._id}).updateOne({
    "$set": {
      "displayName": newDisplayname,
      "username": newDisplayname,
      "slug": newDisplayname,
    }
  });
  count++;
  if(count % 200 === 0) {
    // update per 200 operations and re-init
    const result = bulk.execute();
    if (result.writeErrors.length) console.log('writeerrors', result.writeErrors)
    bulk = db.users.initializeOrderedBulkOp();
  }
}).nonexistant
// Clean up queues
if(count > 0) bulk.execute();
