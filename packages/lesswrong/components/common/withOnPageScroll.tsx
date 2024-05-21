import React from 'react';
import { isClient } from '../../lib/executionEnvironment';

export const useOnPageScroll = (onScrollFn: () => void) => {
  React.useEffect(() => {
    if (isClient) {
      document.addEventListener('scroll', onScrollFn)
      return function cleanup() {
        document.removeEventListener('scroll', onScrollFn);
      };
    }
  }, [onScrollFn]);
}
