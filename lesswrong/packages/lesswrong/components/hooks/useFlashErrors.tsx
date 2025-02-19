import { useCallback } from "react";
import { useMessages } from "../common/withMessages"

/**
 * Wrap a function that may throw an error to flash the error on screen
 * and continue.
 *
 * @param func The function to be wrapped
 * @param flashErrors When true, errors thrown by the function will be displayed as flash messages
 * @returns A wrapped version of the function
 */
export const useFlashErrors = <T, R>(func: (args: T) => R, flashErrors = true) => {
  const {flash} = useMessages();

  const wrappedFunc = useCallback((args: T): R | void => {
    try {
      return func(args);
    } catch (e) {
      if (flashErrors) {
        flash({type: 'error', messageString: e.message});
        return;
      }
      throw new Error("useFlashErrors: An error occurred in the wrapped function", {cause: e});
    }
  }, [flash, flashErrors, func]);

  return wrappedFunc;
}
