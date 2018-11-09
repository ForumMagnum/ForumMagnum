// To be run by copy and pasting into mongodb
bulk = db.users.initializeOrderedBulkOp(); count = 0
errs = []
aggUsers = db.users.aggregate([
  {$match: {username: /_duplicate/}},
  {
    "$project": {
      "newDisplayname": '$username',
    }
  }
])
aggUsers.forEach(function(doc) {
  printjson(doc)
  if (doc.newDisplayname.includes('Davidman') || doc.newDisplayname.includes('Michael_Town')) return
  newDisplayname = doc.newDisplayname.replace(/_duplicate.*/, '')
  try {
    db.users.updateOne({'_id': doc._id}, {
      "$set": {
        "displayName": newDisplayname,
        "username": newDisplayname,
        "slug": newDisplayname,
      }
    })
  } catch (err) {
    errs.push(err)
  }
})
result = bulk.execute()
if (result.writeErrors.length) console.log('writeerrors', result.writeErrors)

// if(count > 0) {
//   const result = bulk.execute()
//   console.log('result', result)
//   if (result.writeErrors.length) console.log('writeerrors', result.writeErrors)
// }

// Clean up queues
// count++
// if(count % 200 === 0) {
//   const result = bulk.execute()
//   if (result.writeErrors.length) console.log('writeerrors', result.writeErrors)
//   bulk = db.users.initializeOrderedBulkOp()
// }
