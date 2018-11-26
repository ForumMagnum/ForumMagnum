// TODO; really should have something to deal with write errors without blowing up

// TODO; comment
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

// TODO; comment
export const wrapVulcanAsyncScript = (name, scriptFunc) => async (...args) => {
  try {
    console.log(`================ ${name} ================`)
    console.time(name)
    await scriptFunc(...args)
  } catch (err) {
    console.error(`Failed to run ${name}, got error ${err}`)
  } finally {
    console.timeEnd(name)
    console.log(`============ ${name} exiting ============`)
  }
}
