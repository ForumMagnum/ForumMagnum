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

  /**
   * If true, behaves like a debounce rather than throttle, where subsequent calls within
   * the window keep pushing back execution until a full window passes without any calls.
   */
  noMaxWait?: boolean
}

interface DebouncedCallbackState<T> {
  callIsPending: boolean
  pendingArgs: T|null
  nextCallAtTime: number|null
  timerId: NodeJS.Timer|null
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
  const { rateLimitMs, callOnLeadingEdge, onUnmount, allowExplicitCallAfterUnmount, noMaxWait } = options;
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

    const doAfterDelay = () => {
      if (!_state.current.isMounted && !allowExplicitCallAfterUnmount) {
        return;
      }
      _state.current.callIsPending = false;
      const argsToCall = _state.current.pendingArgs!
      _state.current.pendingArgs = null;
      _state.current.nextCallAtTime = null;
      refStabilizedFn(argsToCall);
    };

    if (_state.current.callIsPending) {
      _state.current.pendingArgs = args;
      // If we're debouncing rather than throttling and there's already a pending call when another call is made,
      // clear any existing timers and reset the clock
      if (noMaxWait && _state.current.timerId) {
        clearTimeout(_state.current.timerId);
        _state.current.nextCallAtTime = new Date().getTime() + rateLimitMs;
        _state.current.timerId = setTimeout(doAfterDelay, rateLimitMs);
      }
    } else {
      if (_state.current.nextCallAtTime || !callOnLeadingEdge) {
        if (noMaxWait && _state.current.timerId) {
          clearTimeout(_state.current.timerId);
        }
        const now = new Date();
        // If `callOnLeadingEdge` is false, wait the full rate limit for the next call,
        // since otherwise we call on the "next" leading edge if `nextCallAtTime` is set from a previous call.
        // Doing that breaks `noMaxWait`
        const delay = _state.current.nextCallAtTime && !callOnLeadingEdge
          ? _state.current.nextCallAtTime - now.getTime()
          : rateLimitMs;
        _state.current.callIsPending = true;
        _state.current.pendingArgs = args;
        _state.current.timerId = setTimeout(doAfterDelay, delay);
      } else {
        _state.current.nextCallAtTime = new Date().getTime() + rateLimitMs;
        refStabilizedFn(args);
      }
    }
  //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useStabilizedCallback<T>(fn: (args: T) => void): (args: T) => void {
  const callback = useRef<(args: T) => void>(fn);
  const wrapper = useRef((args: T) => {
    return callback.current(args);
  });
  callback.current = fn;
  return wrapper.current;
}
