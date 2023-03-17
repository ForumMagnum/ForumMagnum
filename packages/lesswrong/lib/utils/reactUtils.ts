import { useReducer } from 'react';

function _toggleBoolean(val: boolean) {
  return !val;
}

/**
 * Like useState<boolean>, but instead of returning two values [state,setState]
 * the second value is a toggle function which takes no arguments.
 */
export function useToggle(initialValue: boolean): [boolean,()=>void] {
  const [state,dispatch] = useReducer(_toggleBoolean, initialValue);
  return [state,dispatch];
}

