import { isServer } from '@/lib/executionEnvironment';
import { isPromise } from '@/lib/vulcan-lib/utils';
import { loggerConstructor } from '@/lib/utils/logging'

export interface CallbackPropertiesBase<N extends CollectionNameString> {
  // TODO: Many of these are empirically optional, but setting them to optional
  // causes a bajillion type errors, so we will not be fixing today
  currentUser: DbUser|null
  collection: CollectionBase<N>
  context: ResolverContext
  schema: SchemaType<N>
}

export class CallbackChainHook<IteratorType,ArgumentsType extends any[]> {
  private _name: string
  private _callbacks: Array<AnyBecauseTodo> = []
  
  constructor(name: string) {
    this._name = name;
  }
  
  add = (fn: (doc: IteratorType, ...args: ArgumentsType) =>
    (Promise<IteratorType|Partial<IteratorType>> | IteratorType | undefined | void)
  ) => {
    this._callbacks.push(fn);
    if (this._callbacks.length > 20) {
      // eslint-disable-next-line no-console
      console.log(`Warning: Excessively many callbacks (${this._callbacks.length}) on hook ${this._name}.`);
    }
  }
  
  runCallbacks = async ({iterator, properties, ignoreExceptions}: {iterator: IteratorType, properties: ArgumentsType, ignoreExceptions?: boolean}): Promise<IteratorType> => {
    const start = Date.now();

    const result = await this._runCallbacks({
      iterator, properties, ignoreExceptions
    });

    const timeElapsed = Date.now() - start;
    // Need to use this from Globals to avoid import cycles
    // Temporarily disabled to investigate performance issues
    // Globals.captureEvent('callbacksCompleted', {
    //   callbackHookName: this.name,
    //   timeElapsed
    // }, true);

    return result;
  }

  /**
   * @summary Successively run all of a hook's callbacks on an item
   * @param {String} hook - First argument: the name of the hook, or an array
   * @param {Object} item - Second argument: the post, comment, modifier, etc. on which to run the callbacks
   * @param {Any} args - Other arguments will be passed to each successive iteration
   * @param {Array} callbacks - Optionally, pass an array of callback functions instead of passing a hook name
   * @param {Boolean} ignoreExceptions - Only available as a named argument, default true. If true, exceptions
   *   thrown from callbacks will be logged but otherwise ignored. If false, exceptions thrown from callbacks
   *   will be rethrown.
   * @returns {Object} Returns the item after it's been through all the callbacks for this hook
   */
  _runCallbacks = <N extends CollectionNameString> (options: {
    iterator?: any,
    // A bit of a mess. If you stick to non-deprecated hooks, you'll get the typed version
    properties: [CallbackPropertiesBase<N>]|any[],
    ignoreExceptions?: boolean,
  }) => {
    const logger = loggerConstructor(`callbacks-${options.properties[0]?.collection?.collectionName.toLowerCase()}`)
    const hook = this._name;
    const item = options.iterator;
    const args = options.properties;
    let ignoreExceptions: boolean;
    if ("ignoreExceptions" in options)
      ignoreExceptions = !!options.ignoreExceptions;
    else
      ignoreExceptions = true;
    const callbacks = this._callbacks;
  
    // flag used to detect the callback that initiated the async context
    let asyncContext = false;
    
    let inProgressCallbackKey = markCallbackStarted(hook);
    
    try {
      if (typeof callbacks !== 'undefined' && !!callbacks.length) { // if the hook exists, and contains callbacks to run
        const runCallback = (accumulator: AnyBecauseTodo, callback: AnyBecauseTodo) => {
          logger(`\x1b[32m[${hook}] [${callback.name || 'noname callback'}]\x1b[0m`); //]]
          try {
            const result = callback.apply(this, [accumulator].concat(args));
    
            if (typeof result === 'undefined') {
              // if result of current iteration is undefined, don't pass it on
              // logger(`// Warning: Sync callback [${callback.name}] in hook [${hook}] didn't return a result!`)
              return accumulator;
            } else {
              return result;
            }
    
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log(`\x1b[31m// error at callback [${callback.name}] in hook [${hook}]\x1b[0m`); //]]
            // eslint-disable-next-line no-console
            console.log(error);
            if (error.break || (error.data && error.data.break) || !ignoreExceptions) {
              throw error;
            }
            // pass the unchanged accumulator to the next iteration of the loop
            return accumulator;
          }
        };
    
        const result = callbacks.reduce(function (accumulator: AnyBecauseTodo, callback: AnyBecauseTodo, index: AnyBecauseTodo) {
          if (isPromise(accumulator)) {
            if (!asyncContext) {
              logger(`\x1b[32m[${hook}] Started async context for [${callbacks[index-1] && callbacks[index-1].name}]\x1b[0m`); //]]
              asyncContext = true;
            }
            return new Promise((resolve, reject) => {
              accumulator
                .then(result => {
                  if (result === undefined) {
                    // eslint-disable-next-line no-console
                    console.error('Async before callbacks should not return undefined. Please return the document/data instead')
                  }
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
        
        return result;
      } else { // else, just return the item unchanged
        return item;
      }
    } finally {
      markCallbackFinished(inProgressCallbackKey, hook);
    }
  };
}

export class CallbackHook<ArgumentsType extends any[]> {
  private _name: string
  private _callbacks: Array<AnyBecauseTodo> = []
  
  constructor(name: string) {
    this._name = name;
  }
  
  add = (fn: (...args: ArgumentsType) => void|Promise<void>) => {
    this._callbacks.push(fn);
    if (this._callbacks.length > 20) {
      // eslint-disable-next-line no-console
      console.log(`Warning: Excessively many callbacks (${this._callbacks.length}) on hook ${this._name}.`);
    }
  }
  
  runCallbacksAsync = async (properties: ArgumentsType): Promise<void> => {
    const start = Date.now();

    await this._runCallbacksAsync({ properties });

    const timeElapsed = Date.now() - start;
    // Need to use this from Globals to avoid import cycles
    // Temporarily disabled to investigate performance issues 
    // Globals.captureEvent('callbacksCompleted', {
    //   callbackHookName: this.name,
    //   timeElapsed
    // }, true);
  }

  /**
   * @summary Successively run all of a hook's callbacks on an item, in async mode (only works on server)
   * @param {String} hook - First argument: the name of the hook
   * @param {Any} args - Other arguments will be passed to each successive iteration
   */
  _runCallbacksAsync = <N extends CollectionNameString> (options: {
    // A bit of a mess. If you stick to non-deprecated hooks, you'll get the typed version
    properties: [CallbackPropertiesBase<N>]|any[]
  }) => {
    const logger = loggerConstructor(`callbacks-${options.properties[0]?.collection?.collectionName.toLowerCase()}`)
    const hook = this._name;
    const args = options.properties;
  
    const callbacks = this._callbacks
  
    if (isServer && typeof callbacks !== 'undefined' && !!callbacks.length) {
      let pendingDeferredCallbackStart = markCallbackStarted(hook);
  
      // use defer to avoid holding up client
      setTimeout(function () {
        // run all post submit server callbacks on post object successively
        callbacks.forEach(function (this: any, callback: AnyBecauseTodo) {
          logger(`\x1b[32m[${hook}]: [${callback.name || 'noname callback'}]\x1b[0m`); //]]
          
          let pendingAsyncCallback = markCallbackStarted(hook);
          try {
            let callbackResult = callback.apply(this, args);
            if (isPromise(callbackResult)) {
              callbackResult
                .then(
                  result => markCallbackFinished(pendingAsyncCallback, hook),
                  exception => {
                    markCallbackFinished(pendingAsyncCallback, hook)
                    // eslint-disable-next-line no-console
                    console.log(`Error running async callback [${callback.name}] on hook [${hook}]`);
                    // eslint-disable-next-line no-console
                    console.log(exception);
                    throw exception;
                  }
                )
            } else {
              markCallbackFinished(pendingAsyncCallback, hook);
            }
          } finally {
            markCallbackFinished(pendingAsyncCallback, hook);
          }
        });
        
        markCallbackFinished(pendingDeferredCallbackStart, hook);
      }, 0);
  
    }
  }
}

// Dictionary of all outstanding callbacks (key is an ID, value is `true`). If
// there are no outstanding callbacks, this should be an empty dictionary.
let pendingCallbackKeys: Partial<Record<string,true>> = {};

let pendingCallbackDescriptions: Record<string,number> = {};

// ID for a pending callback. Incremements with each call to
// `markCallbackStarted`.
let pendingCallbackKey = 0;

// Count of the number of outstanding callbacks. Used to check that this isn't
// leaking.
let numCallbacksPending = 0;

// When starting an async callback, assign it an ID, record the fact that it's
// running, and return the ID.
function markCallbackStarted(description: string): number {
  if (numCallbacksPending > 1000) {
    // eslint-disable-next-line no-console
    console.log(`Warning: Excessively many background callbacks running (numCallbacksPending=${numCallbacksPending}) while trying to add callback ${description}`);
  }
  numCallbacksPending++;
  
  if (pendingCallbackKey >= Number.MAX_SAFE_INTEGER)
    pendingCallbackKey = 0;
  else
    pendingCallbackKey++;
  pendingCallbackKeys[pendingCallbackKey] = true;
  
  if (description in pendingCallbackDescriptions) {
    pendingCallbackDescriptions[description]++;
  } else {
    pendingCallbackDescriptions[description] = 1;
  }
  
  return pendingCallbackKey;
}

// Record the fact that an async callback with the given ID has finished.
function markCallbackFinished(id: number, description: string) {
  numCallbacksPending--;
  delete pendingCallbackKeys[id];
  
  if (!pendingCallbackDescriptions[description] || pendingCallbackDescriptions[description]===1) {
    delete pendingCallbackDescriptions[description];
  } else {
    pendingCallbackDescriptions[description]--;
  }
}

// Return whether there is at least one async callback running.
export const callbacksArePending = (): boolean => {
  for(let _ in pendingCallbackKeys) {
    return true;
  }
  return false;
}

export function printInProgressCallbacks() {
  const callbacksInProgress = Object.keys(pendingCallbackDescriptions);
  // eslint-disable-next-line no-console
  console.log(`Callbacks in progress: ${callbacksInProgress.map(c => pendingCallbackDescriptions[c]!==1 ? `${c}(${pendingCallbackDescriptions[c]})` : c).join(", ")}`);
}
