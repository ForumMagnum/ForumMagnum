// TODO; really should have something to deal with write errors without blowing up

export const bulkUpdateWithJS = async ({collection, query={}, queryOptions={}, updateFunction}) => {
  const documents = collection.find(query, queryOptions)
  const updates = documents.map(document => ({
    updateOne: {
      filter: {
        _id: document._id
      },
      update: updateFunction(document)
    }
  }))
  await collection.rawCollection().bulkWrite(updates)
}

// TODO export const wrapVulcanAsyncScript = async
