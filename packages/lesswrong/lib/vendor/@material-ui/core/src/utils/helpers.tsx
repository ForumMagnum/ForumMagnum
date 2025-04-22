import warning from 'warning';

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function contains<O1 extends O2, O2 extends {}>(obj: O1, pred: O2): boolean {
  return Object.keys(pred).every(key => {
    return obj.hasOwnProperty(key) && (obj as any)[key] === (pred as any)[key];
  });
}

export function findIndex(arr: any[], pred: any): number {
  const predType = typeof pred;
  for (let i = 0; i < arr.length; i += 1) {
    if (predType === 'function' && !!pred(arr[i], i, arr) === true) {
      return i;
    }
    if (predType === 'object' && contains(arr[i], pred)) {
      return i;
    }
    if (['string', 'number', 'boolean'].indexOf(predType) !== -1) {
      return arr.indexOf(pred);
    }
  }
  return -1;
}

export function find<T>(arr: T[], pred: any): T|undefined {
  const index = findIndex(arr, pred);
  return index > -1 ? arr[index] : undefined;
}

export type ChainedFunction = ((...args: any[]) => void) | undefined | null;

/**
 * Safe chained function
 *
 * Will only create a new function if needed,
 * otherwise will pass back existing functions or null.
 *
 * @param {function} functions to chain
 * @returns {function|null}
 */
export function createChainedFunction(...funcs: ChainedFunction[]) {
  return funcs.reduce(
    (acc: AnyBecauseTodo, func) => {
      if (func == null) {
        return acc;
      }

      warning(
        typeof func === 'function',
        'Material-UI: invalid Argument Type, must only provide functions, undefined, or null.',
      );

      return function chainedFunction(...args) {
        acc.apply(this as any, args);
        func.apply(this as any, args);
      };
    },
    () => {},
  );
}
