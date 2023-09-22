import { useReducer } from 'react';

export function useForceRerender() {
  const [_,rerender] = useReducer(c=>c+1, 0);
  return rerender;
}
