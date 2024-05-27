import { loggerConstructor } from "@/lib/utils/logging";
import { isPromise } from "@/lib/vulcan-lib/utils";

// Run a provided list of callback functions, in a chain. This is similar to
// runCallbacks (which does the same, except it gets the functions from a named
// hook). This is used only by vulcan-forms, which previously was using
// runCallbacks, but is new separated out in order to make runCallbacks more
// refactor-able.
export const runCallbacksList = function (this: any, options: {
  iterator?: any,
  properties?: any, // Properties here, from Forms, seems to be a mess
  callbacks: any,
}) {
  const logger = loggerConstructor(`callbacks-form`)
  const item = options.iterator;
  const args = options.properties;
  const ignoreExceptions = true;
  const callbacks = options.callbacks;

  // flag used to detect the callback that initiated the async context
  let asyncContext = false;
  
  if (typeof callbacks !== 'undefined' && !!callbacks.length) {

    const runCallback = (accumulator: AnyBecauseTodo, callback: AnyBecauseTodo) => {
      logger(`running callback ${callback.name}`)
      try {
        const result = callback.apply(this, [accumulator].concat(args));

        if (typeof result === 'undefined') {
          // if result of current iteration is undefined, don't pass it on
          return accumulator;
        } else {
          return result;
        }

      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(`error at callback [${callback.name}] in callbacks list`);
        // eslint-disable-next-line no-console
        console.log(error);
        if (error.break || (error.data && error.data.break) || !ignoreExceptions) {
          throw error;
        }
        // pass the unchanged accumulator to the next iteration of the loop
        return accumulator;
      }
    };

    logger("Running callbacks list")
    return callbacks.reduce(function (accumulator: AnyBecauseTodo, callback: AnyBecauseTodo, index: AnyBecauseTodo) {
      if (isPromise(accumulator)) {
        if (!asyncContext) {
          asyncContext = true;
        }
        return new Promise((resolve, reject) => {
          accumulator
            .then(result => {
              try {
                // run this callback once we have the previous value
                resolve(runCallback(result, callback));
              } catch (error) {
                // error will be thrown only for breaking errors, so throw it up in the promise chain
                reject(error);
              }
            })
            .catch(reject);
        });
      } else {
        return runCallback(accumulator, callback);
      }
    }, item);

  } else { // else, just return the item unchanged
    return item;
  }
}
