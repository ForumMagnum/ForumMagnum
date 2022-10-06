import { useRef } from "react";

export const useIsFirstRender = () => {
  const isFirstRender = useRef(true);
  const {current} = isFirstRender;
  isFirstRender.current = false;
  return current;
}
