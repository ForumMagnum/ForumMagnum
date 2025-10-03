// Bulk apply a js function to a mongo collection; this is possibly less
// performant, but much easier to write than the mongo update syntax.
//
// query and queryOptions are passed directly to Meteor's collection.find method.
//
// TODO: Make a slower version of this that handles errors better
// Despite the presence of writeErrors in the result, the update appears to
// crash and stop on some errors
// TODO: Fails if nothing matches the query
export const bulkUpdateWithJS = async ({collection, query={}, queryOptions={}, updateFunction}: AnyBecauseTodo) => {
  const documents = await collection.find(query, queryOptions)
  const updates = await Promise.all(documents.map(async (document: AnyBecauseTodo) => ({
    updateOne: {
      filter: {
        _id: document._id
      },
      update: await updateFunction(document)
    }
  })));
  await collection.rawCollection().bulkWrite(updates)
}

// Better dev experience for running async scripts from the meteor shell.
//
// When calling async functions from the command line, it is unavoidable that
// the function will return instantly. The program will continue to run and to
// log output in the main meteor program. We would like to know definitively
// when the script exits. While we're at it, we can learn what errors caused
// the script to crash, and get the total runtime.
// Note that this is a function which takes a function and returns a function.
// Use case is as follows:
//
// In some script file (remember to import the file in lesswrong/server.js!):
//
// import { wrapVulcanAsyncScript } from './utils'
//
// Vulcan.fixAllTheThings = wrapVulcanAsyncScript('fixAllTheThings', async (foo, bar) => {
//   await fixThing1(foo)
//   await fixThing2(bar)
// })
//
// In the meteor shell:
//
// > Vulcan.fixAllTheThings('fee', 'bee')
export const wrapVulcanAsyncScript = (name: string, scriptFunc: Function) => async (...args: AnyBecauseTodo[]) => {
  try {
    // eslint-disable-next-line no-console
    console.log(`================ ${name} ================`)
    // eslint-disable-next-line no-console
    console.time(name)
    await scriptFunc(...args)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to run ${name}, got error ${err}`)
  } finally {
    // eslint-disable-next-line no-console
    console.timeEnd(name)
    // eslint-disable-next-line no-console
    console.log(`============ ${name} exiting ============`)
  }
}

export function getFieldsWithAttribute(schema: AnyBecauseTodo, attributeName: string): Array<string> {
  return Object.keys(schema).filter((fieldName) => !!schema[fieldName][attributeName])
}

export async function urlIsBroken(url: string): Promise<boolean> {
  try {
    let result = await fetch(url, {});
    // TODO: Jim: Set a timeout here. This had a 5s timeout using meteor/HTTP,
    // but I rewrote it to node-fetch in the transition away from meteor, which
    // doesn't have a straightforward timeout option.
    const statusCode = result.status;
    if (statusCode >= 300 && statusCode <= 399) {
      // Redirect. In principle this shouldn't happen because meteor's HTTP.call
      // is documented to follow redirects by default. But maybe it does happen.
      //eslint-disable-next-line no-console
      console.log("Got "+statusCode+" redirect on "+url)
      return false
    } else if (statusCode !== 200) {
      return true
    } else {
      return false
    }
  } catch(e) {
    return true
  }
}
