import { loggerConstructor } from '@/lib/utils/logging'
import { sleep } from '@/lib/utils/asyncUtils';
import { captureException } from '@sentry/core';

type MaybePromise<T> = T|Promise<T>

type CallbackChainFn<IteratorType,ArgumentsType extends any[]> = (doc: IteratorType, ...args: ArgumentsType) => (MaybePromise<IteratorType> | undefined | void)

/**
 * A set of callbacks which run in a chain, each modifying a value and passing
 * it to the next. Each callback in the chain receives a current-version of the
 * object (of type IteratorType) plus additional arguments (of type
 * ArgumentsType), and either returns a new value which replaces the one it was
 * passed, or undefined (in which case it leaves it unchanged). The return
 * value of the last step in the chain is returned as the overall result.
 *
 * If `ignoreExceptions: false` is passed to `runCallbacks`, any exception will
 * stop later functions from running, and bubble out of the call to
 * `runCallbacks`. Otherwise, exceptions will be `console.log`'ed but otherwise
 * have no effect.
 */
export class CallbackChainHook<IteratorType,ArgumentsType extends any[]> {
  private _name: string
  private _callbacks: Array<CallbackChainFn<IteratorType,ArgumentsType>> = []
  
  constructor(name: string) {
    this._name = name;
  }
  
  add = (fn: CallbackChainFn<IteratorType,ArgumentsType>) => {
    this._callbacks.push(fn);
    if (this._callbacks.length > 20) {
      // eslint-disable-next-line no-console
      console.log(`Warning: Excessively many callbacks (${this._callbacks.length}) on hook ${this._name}.`);
    }
  }

  runCallbacks = async (options: {
    iterator: IteratorType,
    properties: ArgumentsType,
    ignoreExceptions?: boolean,
  }): Promise<IteratorType> => {
    const start = Date.now();
    const logger = loggerConstructor(`callbacks-${options.properties[0]?.collection?.collectionName.toLowerCase()}`)
    const hook = this._name;
    const item = options.iterator;
    const args = options.properties;
    const ignoreExceptions = ("ignoreExceptions" in options) ? options.ignoreExceptions : true;
    
    let inProgressCallbackKey = markCallbackStarted(hook);
    
    // Wrapper around a single callback that fills in the return value if the
    // callback function returns undefined, and eats exceptions (with a
    // console.log) if ignoreExceptions is true.
    const runCallback = (accumulator: IteratorType, callback: CallbackChainFn<IteratorType,ArgumentsType>) => {
      logger(`\x1b[32m[${hook}] [${callback.name || 'noname callback'}]\x1b[0m`); //]]
      try {
        const result = callback.apply(this, [accumulator, ...args]);

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
        captureException(error);
        if (error.break || (error.data && error.data.break) || !ignoreExceptions) {
          throw error;
        }
        // pass the unchanged accumulator to the next iteration of the loop
        return accumulator;
      }
    };

    let result = item;
    try {
      for (const callback of this._callbacks) {
        result = await runCallback(result, callback);
      }
      
    } finally {
      markCallbackFinished(inProgressCallbackKey, hook);
    }

    const timeElapsed = Date.now() - start;
    // Need to use this from Globals to avoid import cycles
    // Temporarily disabled to investigate performance issues
    // Globals.captureEvent('callbacksCompleted', {
    //   callbackHookName: this.name,
    //   timeElapsed
    // }, true);

    return result;
  };
}

type CallbackHookFn<ArgumentsType extends any[]> = (...args: ArgumentsType) => void|Promise<void>

/**
 * A set of callbacks, which are run independently/concurrently and which
 * return nothing. Running the callbacks returned immediately (they are
 * deferred to run in the background); any exceptions bubble out to a top-level
 * context, rather than to the function that called them.
 */
export class CallbackHook<ArgumentsType extends any[]> {
  private _name: string
  private _callbacks: Array<CallbackHookFn<ArgumentsType>> = []
  
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

  runCallbacksAsync = async (args: ArgumentsType) => {
    const start = Date.now();
    const logger = loggerConstructor(`callbacks-${this._name}`)
    let pendingDeferredCallbackStart = markCallbackStarted(this._name);

    void (async () => {
      // defer to avoid holding up client
      await sleep(0);
  
      await Promise.all(this._callbacks.map(async (callback) => {
        logger(`\x1b[32m[${this._name}]: [${callback.name || 'noname callback'}]\x1b[0m`); //]]
        let pendingAsyncCallback = markCallbackStarted(this._name);
  
        try {
          await callback.apply(null, args);
        } catch(e) {
          // eslint-disable-next-line no-console
          console.log(`Error running async callback [${callback.name}] on hook [${this._name}]`);
          // eslint-disable-next-line no-console
          console.log(e);
          captureException(e);
          throw e;
        } finally {
          markCallbackFinished(pendingAsyncCallback, this._name);
        }
      }));
      
      markCallbackFinished(pendingDeferredCallbackStart, this._name);
  
      const timeElapsed = Date.now() - start;
      // Need to use this from Globals to avoid import cycles
      // Temporarily disabled to investigate performance issues 
      // Globals.captureEvent('callbacksCompleted', {
      //   callbackHookName: this.name,
      //   timeElapsed
      // }, true);
    })();
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
