import React from 'react';
import { isClient } from '../../lib/executionEnvironment';

export const useOnPageScroll = (onScrollFn: ()=>void) => {
  console.log("useOnPageScroll", onScrollFn)
  console.log(onScrollFn)
  React.useEffect(() => {
    if (isClient) {
      const newFunction = () => setTimeout(onScrollFn, 0)
      document.addEventListener('scroll', newFunction)
      
      return function cleanup() {
        console.log("Cleaning up useOnPageScroll")
        document.removeEventListener('scroll', newFunction);
      };
    }
  }, [onScrollFn]);
}
