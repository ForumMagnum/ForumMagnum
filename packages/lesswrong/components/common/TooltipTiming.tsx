"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const TOOLTIP_OPEN_DELAY_MS = 75;
const TOOLTIP_WARM_WINDOW_MS = 300;

interface TooltipTimingController {
  isWarm: () => boolean
  markOpened: (tooltipId: symbol) => void
  markClosed: (tooltipId: symbol) => void
  dispose: () => void
}

function createTooltipTimingController(): TooltipTimingController {
  const openTooltips = new Set<symbol>();
  let warm = false;
  let warmWindowTimeout: NodeJS.Timeout | null = null;

  function clearWarmWindowTimeout() {
    if (warmWindowTimeout) {
      clearTimeout(warmWindowTimeout);
      warmWindowTimeout = null;
    }
  }

  function markOpened(tooltipId: symbol) {
    openTooltips.add(tooltipId);
    warm = true;
    clearWarmWindowTimeout();
  }

  function markClosed(tooltipId: symbol) {
    if (!openTooltips.delete(tooltipId) || openTooltips.size > 0) {
      return;
    }

    clearWarmWindowTimeout();
    warmWindowTimeout = setTimeout(() => {
      warm = false;
      warmWindowTimeout = null;
    }, TOOLTIP_WARM_WINDOW_MS);
  }

  function dispose() {
    openTooltips.clear();
    warm = false;
    clearWarmWindowTimeout();
  }

  return {
    isWarm: () => warm,
    markOpened,
    markClosed,
    dispose,
  };
}

const defaultTooltipTimingController = createTooltipTimingController();
const TooltipTimingContext = createContext(defaultTooltipTimingController);

export const TooltipTimingProvider = ({ children }: {
  children: React.ReactNode
}) => {
  const [controller] = useState(createTooltipTimingController);

  useEffect(() => () => controller.dispose(), [controller]);

  return <TooltipTimingContext.Provider value={controller}>
    {children}
  </TooltipTimingContext.Provider>;
};

export const useTooltipOpenDelay = (hover: boolean, delay: boolean): boolean => {
  const controller = useContext(TooltipTimingContext);
  const tooltipIdRef = useRef(Symbol("tooltip"));
  const openDelayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRegisteredOpenRef = useRef(false);
  const [open, setOpen] = useState(hover && !delay);

  const clearOpenDelayTimeout = useCallback(() => {
    if (openDelayTimeoutRef.current) {
      clearTimeout(openDelayTimeoutRef.current);
      openDelayTimeoutRef.current = null;
    }
  }, []);

  const unregisterOpenTooltip = useCallback(() => {
    if (isRegisteredOpenRef.current) {
      controller.markClosed(tooltipIdRef.current);
      isRegisteredOpenRef.current = false;
    }
  }, [controller]);

  const openDelayedTooltip = useCallback(() => {
    if (!isRegisteredOpenRef.current) {
      controller.markOpened(tooltipIdRef.current);
      isRegisteredOpenRef.current = true;
    }
    setOpen(true);
    openDelayTimeoutRef.current = null;
  }, [controller]);

  useEffect(() => {
    clearOpenDelayTimeout();

    if (!hover) {
      unregisterOpenTooltip();
      setOpen(false);
      return;
    }

    if (!delay) {
      unregisterOpenTooltip();
      setOpen(true);
      return;
    }

    if (controller.isWarm()) {
      openDelayedTooltip();
      return;
    }

    setOpen(false);
    openDelayTimeoutRef.current = setTimeout(openDelayedTooltip, TOOLTIP_OPEN_DELAY_MS);

    return clearOpenDelayTimeout;
  }, [
    clearOpenDelayTimeout,
    controller,
    delay,
    hover,
    openDelayedTooltip,
    unregisterOpenTooltip,
  ]);

  useEffect(() => {
    return () => {
      clearOpenDelayTimeout();
      unregisterOpenTooltip();
    };
  }, [clearOpenDelayTimeout, unregisterOpenTooltip]);

  return open;
};
