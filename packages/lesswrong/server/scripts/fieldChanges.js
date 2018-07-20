// /*
//   Mongo DB query to replace featuredPriority field
// */
//
// db.posts.update(
//   { featuredPriority: {$gt: 0} },
//   {$set: { curatedDate: new ISODate() }},
//   { multi: true }
// )
//
// /*
//   Mongo DB query to replace frontpage field
// */
//
// db.posts.update(
//   { frontpage: true },
//   {$set: { frontpageDate: new ISODate() }},
//   { multi: true }
// )
