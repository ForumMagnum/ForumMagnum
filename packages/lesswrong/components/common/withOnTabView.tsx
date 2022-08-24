import { useEffect } from "react";

export type OnTabViewCallback = () => void;

export const useOnTabView = (callback: OnTabViewCallback) => {
  useEffect(() => {
    const handler = () => {
      if (!document.hidden) {
        callback();
      }
    }
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  });
}
