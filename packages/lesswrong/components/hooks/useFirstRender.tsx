import { useEffect, useRef, useState } from "react";

export const useIsFirstRender = () => {
  const isFirstRender = useRef(true);
  const {current} = isFirstRender;
  isFirstRender.current = false;
  return current;
}

export const useForceRerender = () => {
  const [isFirstRender, setIsFirstRender] = useState(true);
  useEffect(() => {
    setIsFirstRender(false);
  }, []);
  return isFirstRender;
}
