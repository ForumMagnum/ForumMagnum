import { useCallback, useEffect, useRef } from "react";

export interface DebouncedCallbackOptions {
  /**
   * The minimum time between calls to this function, in milliseconds.
   */
  rateLimitMs: number,
  
  /**
   * Whether calling the function when no call is pending, and the delay timer
   * is expired, calls the function immediately (as opposed to waiting for
   * rateLimitMs before calling it).
   */
  callOnLeadingEdge: boolean,

  /**
   * What to do when the component is unmounted.
   *   callIfScheduled: (Default) If a call to the function is pending when the
   *     component is umounted, run it immediately rather than waiting.
   *   stillFollowSchedule: If a call to the function is pending when the
   *     component is unmounted, run it after the scheduled delay as normal.
   *   cancelPending: If a call is pending when the component is unmounted,
   *     cancel it.
   */
  onUnmount: "callIfScheduled"|"stillFollowSchedule"|"cancelPending",

  /**
   * If true, the function remains callable after the component is unmounted
   * (otherwise it's a no-op).
   */
  allowExplicitCallAfterUnmount: boolean,
}

interface DebouncedCallbackState<T> {
  callIsPending: boolean
  pendingArgs: T|null
  nextCallAtTime: number|null
  timerId: number|null
  isMounted: boolean
}

/**
 * Hook for making a debounced (rate limited) function, in a react context.
 * This is meant to disarm various footguns associated with using lodash or
 * underscore's `throttle`/`debounce` functions directly, which makes it very
 * easy to capture a variable and use it while stale.
 *
 * `fn` does not need to be referentially stable; if it changes, then when it
 * runs, it will run the most recently passed version (similar to
 * useStabilizedCallback).
 * `options` does not need to be referentially stable, but the options
 * themselves may not change after  this has rendered for the first time.
 */
export function useDebouncedCallback<T>(fn: (args: T) => void, options: DebouncedCallbackOptions): (args: T) => void {
  const { rateLimitMs, callOnLeadingEdge, onUnmount, allowExplicitCallAfterUnmount } = options;
  const refStabilizedFn = useStabilizedCallback(fn);
  const _state = useRef<DebouncedCallbackState<T>>({
    callIsPending: false,
    pendingArgs: null,
    nextCallAtTime: null,
    isMounted: true,
    timerId: null,
  });
  
  useEffect(() => {
    const state = _state.current;
    state.isMounted = true;

    return () => {
      if (state.isMounted) {
        state.isMounted = false;
        if (state.callIsPending) {
          switch(onUnmount) {
            case "callIfScheduled":
              state.callIsPending = false;
              refStabilizedFn(state.pendingArgs!);
              if (state.timerId) {
                clearTimeout(state.timerId);
                state.timerId = null;
                state.pendingArgs = null;
              }
              break;
            case "stillFollowSchedule":
              break;
            case "cancelPending":
              if (state.timerId) {
                clearTimeout(state.timerId);
                state.timerId = null;
                state.pendingArgs = null;
              }
              break;
          }
        }
      }
    };
  //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return useCallback((args: T) => {
    if (!options.allowExplicitCallAfterUnmount && !_state.current.isMounted) {
      return;
    }
    if (_state.current.callIsPending) {
      _state.current.pendingArgs = args;
    } else {
      if (_state.current.nextCallAtTime || !callOnLeadingEdge) {
        const now = new Date();
        const delay = _state.current.nextCallAtTime
          ? _state.current.nextCallAtTime - now.getTime()
          : rateLimitMs;
        _state.current.callIsPending = true;
        _state.current.pendingArgs = args;
        setTimeout(() => {
          if (!_state.current.isMounted && !allowExplicitCallAfterUnmount) {
            return;
          }
          _state.current.callIsPending = false;
          const argsToCall = _state.current.pendingArgs!
          _state.current.pendingArgs = null;
          _state.current.nextCallAtTime = null;
          refStabilizedFn(argsToCall);
        }, delay);
      } else {
        _state.current.nextCallAtTime = new Date().getTime() + rateLimitMs;
        refStabilizedFn(args);
      }
    }
  //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useStabilizedCallback<T, O>(fn: (args: T) => O): (args: T) => O {
  const callback = useRef<(args: T) => O>(fn);
  const wrapper = useRef((args: T) => {
    return callback.current(args);
  });
  callback.current = fn;
  return wrapper.current;
}


export function useStabilizedCallbackAsync<T>(fn: (args: T) => Promise<void>): (args: T) => Promise<void> {
  const callback = useRef<(args: T) => Promise<void>>(fn);
  const wrapper = useRef((args: T) => {
    return callback.current(args);
  });
  callback.current = fn;
  return wrapper.current;
}
