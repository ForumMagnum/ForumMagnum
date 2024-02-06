import React from 'react';
import { isClient } from '../../lib/executionEnvironment';

export const useGlobalKeydown = (keyboardHandlerFn: (this: Document, ev: KeyboardEvent) => void) => {
  React.useEffect(() => {
    if (isClient) {
      document.addEventListener('keydown', keyboardHandlerFn)
      
      return function cleanup() {
        document.removeEventListener('keydown', keyboardHandlerFn);
      };
    }
  }, [keyboardHandlerFn]);
}

export const useOnSearchHotkey = (keyboardHandlerFn: () => void) => {
  useGlobalKeydown((event) => {
    // Is this Cmd+F/Alt+F/etc?
    const F_Key = 'F'.charCodeAt(0);
    if ((event.metaKey || event.ctrlKey) && event.keyCode === F_Key) {
      keyboardHandlerFn();
    }
  });
}
