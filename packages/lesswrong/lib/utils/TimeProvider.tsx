"use client";
import { createContext, use, useRef, useSyncExternalStore } from "react";
import { isServer } from "../executionEnvironment";
import { useInjectHTML } from "@/components/hooks/useInjectHTML";

type TimeContext = {
  ssrTime: Date|null,
}

export const TimeProviderClientContext = createContext<TimeContext>({ ssrTime: null });

/**
 * TimeProvider and useCurrentTime allow components to get the current time
 * (mainly for displaying relative dates) without causing SSR mismatches. This
 * is subtle, because (a) it needs to transmit the time through a side-channel
 * so that client components can produce an isomorphic render, (b) the side
 * channel needs to be shared between a potentially large number of calls to
 * useCurrentTime, and (c) it also needs to not-break static prerendering, and
 * nextjs * detects and fails on any call to `new Date()` before request time
 * (even if it's for a context provider that isn't going to be consumed until
 * request time).
 *
 * We do this by providing a context with a cell for the time, rather than the
 * time, and filling it in on first call to useCurrentTime.
 */
export function TimeProvider({children}: {children: React.ReactNode}) {
  const ssrTimeRef = useRef<TimeContext>({ssrTime: null});

  return <TimeProviderClientContext.Provider value={ssrTimeRef.current}>
    {children}
  </TimeProviderClientContext.Provider>
}

export function useCurrentTime(): Date {
  if (isServer) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCurrentTimeServer();
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useCurrentTimeClient();
  }
}

function useCurrentTimeServer(): Date {
  const ssrTimeContext = use(TimeProviderClientContext);
  const injectHTML = useInjectHTML();
  if (!ssrTimeContext.ssrTime) {
    const now = new Date();
    ssrTimeContext.ssrTime = now;
    injectHTML(`window.ssrTime = new Date("${now.toISOString()}");`);
  }
  return ssrTimeContext.ssrTime;
}

function useCurrentTimeClient(): Date {
  const nowRef = useRef<Date|null>(null);
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      const ssrTime = window.ssrTimestamp;
      const now = new Date();
      if (ssrTime && isCloseEnough(ssrTime, now)) {
        return ssrTime;
      }
      if (!nowRef.current) {
        nowRef.current = now;
      }
      if (isCloseEnough(nowRef.current, now)) {
        return nowRef.current;
      }
      nowRef.current = now;
      return now;
    },
    () => {
      if (window.ssrTimestamp) return window.ssrTimestamp;
      if (!nowRef.current) nowRef.current = new Date();
      return nowRef.current;
    }
  );
}

function isCloseEnough(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) < 3000;
}

const noop = () => {};
function noopSubscribe(callback: () => void) {
  return noop;
}
