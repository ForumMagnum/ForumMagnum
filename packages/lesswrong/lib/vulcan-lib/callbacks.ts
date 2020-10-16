import { isClient, isServer, runAfterDelay } from '../executionEnvironment';
import { Meteor } from 'meteor/meteor';
import * as _ from 'underscore';

import { debug } from './debug';
import { Utils } from './utils';

/**
 * @summary Format callback hook names
 */
const formatHookName = (hook: string|null): string => hook?.toLowerCase() || "";

/**
 * @summary A list of all registered callback hooks
 */
const CallbackHooks: Array<any> = [];

/**
 * @summary Callback hooks provide an easy way to add extra steps to common operations.
 * @namespace Callbacks
 */
const Callbacks: Record<string,any> = {};


/**
 * @summary Register a callback
 * @param {String} hook - The name of the hook
 * @param {Function} callback - The callback function
 */
export const registerCallback = function (callback) {
  CallbackHooks.push(callback);
};

/**
 * @summary Add a callback function to a hook
 * @param {String} hook - The name of the hook
 * @param {Function} callback - The callback function
 */
export const addCallback = function (hook, callback) {

  const formattedHook = formatHookName(hook);

  // if callback array doesn't exist yet, initialize it
  if (typeof Callbacks[formattedHook] === 'undefined') {
    Callbacks[formattedHook] = [];
  }

  Callbacks[formattedHook].push(callback);
  
  if (Callbacks[formattedHook].length > 15) {
    // eslint-disable-next-line no-console
    console.log(`Warning: Excessively many callbacks (${Callbacks[formattedHook].length}) on hook ${formattedHook}.`);
  }
  
  return callback;
};

/**
 * @summary Remove a callback from a hook
 * @param {string} hookName - The name of the hook
 * @param {Function} callback - A reference to the function which was previously
 *   passed to addCallback.
 */
export const removeCallback = function (hookName, callback) {
  const formattedHook = formatHookName(hookName);
  Callbacks[formattedHook] = _.reject(Callbacks[formattedHook],
    c => c === callback
  );
};

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
export const runCallbacks: any = function (this: any) {

  let hook, item, args, callbacks, ignoreExceptions, formattedHook;
  if (typeof arguments[0] === 'object' && arguments.length === 1) {
    const singleArgument = arguments[0];
    hook = singleArgument.name;
    formattedHook = formatHookName(hook);
    item = singleArgument.iterator;
    args = singleArgument.properties;
    if ("ignoreExceptions" in singleArgument)
      ignoreExceptions = singleArgument.ignoreExceptions;
    else
      ignoreExceptions = true;
    // if callbacks option is passed used that, else use formatted hook name
    callbacks = singleArgument.callbacks ? singleArgument.callbacks : Callbacks[formattedHook];
  } else {
    // OpenCRUD backwards compatibility
    // the first argument is the name of the hook or an array of functions
    hook = arguments[0];
    formattedHook = formatHookName(hook);
    // the second argument is the item on which to iterate
    item = arguments[1];
    // successive arguments are passed to each iteration
    args = Array.prototype.slice.call(arguments).slice(2);
    // if first argument is an array, use that as callbacks array; else use formatted hook name
    callbacks = Array.isArray(hook) ? hook : Callbacks[formattedHook];
    
    ignoreExceptions = true;
  }

  // flag used to detect the callback that initiated the async context
  let asyncContext = false;
  
  if (typeof callbacks !== 'undefined' && !!callbacks.length) { // if the hook exists, and contains callbacks to run

    const runCallback = (accumulator, callback) => {
      debug(`\x1b[32m>> Running callback [${callback.name}] on hook [${formattedHook}]\x1b[0m`);
      const newArguments = [accumulator].concat(args);

      try {
        const result = callback.apply(this, newArguments);

        // if callback is only supposed to run once, remove it
        if (callback.runOnce) {
          removeCallback(formattedHook, callback);
        }

        if (typeof result === 'undefined') {
          // if result of current iteration is undefined, don't pass it on
          // debug(`// Warning: Sync callback [${callback.name}] in hook [${hook}] didn't return a result!`)
          return accumulator;
        } else {
          return result;
        }

      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(`\x1b[31m// error at callback [${callback.name}] in hook [${formattedHook}]\x1b[0m`);
        // eslint-disable-next-line no-console
        console.log(error);
        if (error.break || (error.data && error.data.break) || !ignoreExceptions) {
          throw error;
        }
        // pass the unchanged accumulator to the next iteration of the loop
        return accumulator;
      }
    };

    return callbacks.reduce(function (accumulator, callback, index) {
      if (Utils.isPromise(accumulator)) {
        if (!asyncContext) {
          debug(`\x1b[32m>> Started async context in hook [${formattedHook}] by [${callbacks[index-1] && callbacks[index-1].name}]\x1b[0m`);
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
};

/**
 * @summary Successively run all of a hook's callbacks on an item, in async mode (only works on server)
 * @param {String} hook - First argument: the name of the hook
 * @param {Any} args - Other arguments will be passed to each successive iteration
 */
export const runCallbacksAsync: any = function () {

  let hook, args;
  if (typeof arguments[0] === 'object' && arguments.length === 1) {
    const singleArgument = arguments[0];
    hook = singleArgument.name;
    args = [singleArgument.properties]; // wrap in array for apply
  } else {
    // OpenCRUD backwards compatibility
    // the first argument is the name of the hook or an array of functions
    hook = formatHookName(arguments[0]);
    // successive arguments are passed to each iteration
    args = Array.prototype.slice.call(arguments).slice(1);
  }

  const callbacks = Array.isArray(hook) ? hook : Callbacks[hook];

  if (isServer && typeof callbacks !== 'undefined' && !!callbacks.length) {
    let pendingDeferredCallbackStart = markCallbackStarted(hook);

    // use defer to avoid holding up client
    Meteor.defer(function () {
      // run all post submit server callbacks on post object successively
      callbacks.forEach(function (this: any, callback) {
        debug(`\x1b[32m>> Running async callback [${callback.name}] on hook [${hook}]\x1b[0m`);
        
        let pendingAsyncCallback = markCallbackStarted(hook);
        try {
          let callbackResult = callback.apply(this, args);
          if (Utils.isPromise(callbackResult)) {
            callbackResult
              .then(
                result => markCallbackFinished(pendingAsyncCallback),
                exception => {
                  markCallbackFinished(pendingAsyncCallback)
                  // eslint-disable-next-line no-console
                  console.log(`Error running async callback [${callback.name}] on hook [${hook}]`);
                  // eslint-disable-next-line no-console
                  console.log(exception);
                  throw exception;
                }
              )
          } else {
            markCallbackFinished(pendingAsyncCallback);
          }
        } finally {
          markCallbackFinished(pendingAsyncCallback);
        }
      });
      
      markCallbackFinished(pendingDeferredCallbackStart);
    });

  }
};


// For unit tests. Wait (in 20ms incremements) until there are no callbacks
// in progress. Many database operations trigger asynchronous callbacks to do
// things like generate notifications and add to search indexes; if you have a
// unit test that depends on the results of these async callbacks, writing them
// the naive way would create a race condition. But if you insert an
// `await waitUntilCallbacksFinished()`, it will wait for all the background
// processing to finish before proceeding with the rest of the test.
//
// This is NOT suitable for production (non-unit-test) use, because if other
// threads/fibers are doing things which trigger callbacks, it could wait for
// a long time. It DOES wait for callbacks that were triggered after
// `waitUntilCallbacksFinished` was called, and that were triggered from
// unrelated contexts.
//
// What this tracks specifically is that all callbacks which were registered
// with `addCallback` and run with `runCallbacksAsync` have returned. Note that
// it is possible for a callback to bypass this, by calling a function that
// should have been await'ed without the await, effectively spawning a new
// thread which isn't tracked.
export const waitUntilCallbacksFinished = () => {
  return new Promise(resolve => {
    function finishOrWait() {
      if (callbacksArePending()) {
        runAfterDelay(finishOrWait, 20);
      } else {
        resolve();
      }
    }
    
    finishOrWait();
  });
};

// Dictionary of all outstanding callbacks (key is an ID, value is `true`). If
// there are no outstanding callbacks, this should be an empty dictionary.
let pendingCallbacks = {};

// ID for a pending callback. Incremements with each call to
// `markCallbackStarted`.
let pendingCallbackKey = 0;

// Count of the number of outstanding callbacks. Used to check that this isn't
// leaking.
let numCallbacksPending = 0;

// When starting an async callback, assign it an ID, record the fact that it's
// running, and return the ID.
function markCallbackStarted(description)
{
  if (numCallbacksPending > 1000) {
    // eslint-disable-next-line no-console
    console.log(`Warning: Excessively many background callbacks running (numCallbacksPending=${numCallbacksPending}) while trying to add callback ${description}`);
  }
  numCallbacksPending++;
  
  if (pendingCallbackKey >= Number.MAX_SAFE_INTEGER)
    pendingCallbackKey = 0;
  else
    pendingCallbackKey++;
  pendingCallbacks[pendingCallbackKey] = true;
  return pendingCallbackKey;
}

// Record the fact that an async callback with the given ID has finished.
function markCallbackFinished(id)
{
  numCallbacksPending--;
  delete pendingCallbacks[id];
}

// Return whether there is at least one async callback running.
function callbacksArePending()
{
  for(let id in pendingCallbacks) {
    return true;
  }
  return false;
}
