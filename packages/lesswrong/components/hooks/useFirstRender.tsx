import { useEffect, useRef, useState } from "react";

/**
 * Returns whether this component is being rendered for the first time
 */
export const useIsFirstRender = () => {
  const isFirstRender = useRef(true);
  const {current} = isFirstRender;
  isFirstRender.current = false;
  return current;
}

/**
 * Forces this component to rerender once, after mount
 */
export const useRerenderOnce = () => {
  const [isFirstRender, setIsFirstRender] = useState(true);
  useEffect(() => {
    setIsFirstRender(false);
  }, []);
  return isFirstRender;
}
