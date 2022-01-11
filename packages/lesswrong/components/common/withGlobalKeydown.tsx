import React from 'react';
import { isClient } from '../../lib/executionEnvironment';

export const useGlobalKeydown = (keyboardHandlerFn: (this: Document, ev: KeyboardEvent)=>void) => {
  React.useEffect(() => {
    if (isClient) {
      document.addEventListener('keydown', keyboardHandlerFn)
      
      return function cleanup() {
        document.removeEventListener('keydown', keyboardHandlerFn);
      };
    }
  });
}
