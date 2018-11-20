// TODO; really should have something to deal with write errors without blowing up

export const bulkUpdateWithJS = async ({collection, query={}, queryOptions={}, updateFunction}) => {
  const documents = collection.find(query, queryOptions)
  console.log('docs', documents)
  const updates = documents.map(document => ({
    updateOne: {
      filter: {
        _id: document._id
      },
      update: updateFunction(document)
    }
  }))
  console.log('updates', updates)
  const result = await collection.rawCollection().bulkWrite(updates)
  console.log('result', result)
}

// export const wrapVulcanAsyncScript = async
