import { useEffect } from "react";

export type AsyncEffectCallback = () => Promise<void>;

export const useAsyncEffect = (callback: AsyncEffectCallback, dependencies?: any[]) => {
  useEffect(() => {
    void callback();
  }, dependencies);
}
