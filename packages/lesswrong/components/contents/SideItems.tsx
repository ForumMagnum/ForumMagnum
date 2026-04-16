import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import orderBy from 'lodash/orderBy';
import { createPortal } from 'react-dom';
import { getOffsetChainTop } from '@/lib/utils/domUtil';
import { defineStyles, useStyles } from '../hooks/useStyles';

export type SideItemOptions = {
  format: "block"|"icon",
  offsetTop: number,
  measuredElement?: React.RefObject<HTMLElement|null>,
}
const defaultSideItemOptions: SideItemOptions = {
  format: "block",
  offsetTop: 0,
};

type SideItem = {
  id: number
  anchorEl: HTMLElement
  container: HTMLElement
  options: SideItemOptions
  
  anchorTop: number|null
  anchorLeft: number|null
  sideItemHeight: number|null
}
type SideItemsState = {
  maxId: number
  sideItems: SideItem[]
  focusedAnchor: HTMLElement | null
}
type SideItemsPlacementContextType = {
  addSideItem: (anchorEl: HTMLElement, options: SideItemOptions) => HTMLDivElement
  removeSideItem: (anchorEl: HTMLElement) => void
  resizeItem: (anchorEl: HTMLElement, newHeight: number) => void
  setFocusedAnchor: (anchorEl: HTMLElement | null) => void
}
type SideItemsDisplayContextType = {
  sideItems: SideItem[]
  focusedAnchor: HTMLElement | null
};
const SideItemsPlacementContext = createContext<SideItemsPlacementContextType|null>(null);
const SideItemsDisplayContext = createContext<SideItemsDisplayContextType|null>(null);

export type SideItemContentContextType = {
};
export const SideItemContentContext = createContext<SideItemContentContextType|null>(null);

export const styles = defineStyles("SideItems", (theme: ThemeType) => ({
  sideItem: {
    position: "absolute",
    width: "100%",
    transition: "top 0.25s ease-in-out",
  },
  sidebar: {
    position: "relative",
    height: "100%",
  },
}));

///////////////////////////////////////////////////////////////////////////

function useForceRerender() {
  const [renderCount, rerender] = useReducer(c=>c+1, 0);
  return {renderCount, rerender};
}

export const SideItemsContainer = ({
  children,
  hideBlockSideItems = false,
}: {
  children: React.ReactNode
  hideBlockSideItems?: boolean
}) => {
  const classes = useStyles(styles);
  const state = useRef<SideItemsState>({sideItems: [], maxId: -1, focusedAnchor: null});
  const contentsRef = useRef<HTMLDivElement|null>(null);
  const {renderCount, rerender} = useForceRerender();
  
  const addSideItem = useCallback((anchorEl: HTMLElement, options: SideItemOptions) => {
    const container = document.createElement("div");
    container.setAttribute("class", classes.sideItem);
    state.current.sideItems = [...state.current.sideItems, {
      id: ++state.current.maxId,
      anchorEl, container,
      options,
      anchorTop: null, anchorLeft: null, sideItemHeight: null,
    }];
    rerender();
    return container;
  }, [rerender, classes]);
  
  const removeSideItem = useCallback((anchorEl: HTMLElement) => {
    const removedItemIndex = state.current.sideItems.findIndex(s => s.anchorEl === anchorEl);
    if (removedItemIndex >= 0) {
      const [removedItem] = state.current.sideItems.splice(removedItemIndex, 1);
      if (removedItem) {
        removedItem.container.remove();
      }
      rerender();
    }
  }, [rerender]);
  
  const resizeItem = useCallback((anchorEl: HTMLElement, newHeight: number) => {
    // Find the corresponding sideItem
    const sideItem = state.current.sideItems.find(s => s.container === anchorEl);
    
    // Compare height reported by the ResizeObserver to the last known height.
    // Round down, becauses the ResizeObserver may report a non-integer size,
    // but when we measure it with `Element.clientHeight`, it gets rounded.
    if (sideItem && sideItem.sideItemHeight && Math.abs(sideItem.sideItemHeight - newHeight) >= 1.0) {
      state.current.sideItems = [...state.current.sideItems];
      rerender();
    }
  }, [rerender]);
  
  const setFocusedAnchor = useCallback((anchorEl: HTMLElement | null) => {
    if (state.current.focusedAnchor !== anchorEl) {
      state.current.focusedAnchor = anchorEl;
      rerender();
    }
  }, [rerender]);

  const sideItemsPlacementContext: SideItemsPlacementContextType = useMemo(() => ({
    addSideItem, removeSideItem, resizeItem, setFocusedAnchor
  }), [addSideItem, removeSideItem, resizeItem, setFocusedAnchor]);
  
  const sideItemsDisplayContext: SideItemsDisplayContextType = useMemo(() => ({
    sideItems: hideBlockSideItems
      ? state.current.sideItems.filter((sideItem) => sideItem.options.format !== "block")
      : state.current.sideItems,
    focusedAnchor: state.current.focusedAnchor,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [renderCount, state.current.sideItems, state.current.focusedAnchor, hideBlockSideItems]);
  
  useEffect(() => {
    // Watch contents for size-change of the central column, which will happen
    // if text reflows because browser width changed, or if the user
    // opened/closed a collapsible section, or various other things. When that
    // happens, rerender, so that the vertical positions of anchor elements are
    // rechecked.
    const contentsDiv = contentsRef.current;
    if (contentsDiv) {
      const resizeObserver = new ResizeObserver((_entries) => {
        rerender();
      });
      resizeObserver.observe(contentsDiv);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [rerender]);
  
  return (
    <SideItemsPlacementContext.Provider value={sideItemsPlacementContext}>
    <SideItemsDisplayContext.Provider value={sideItemsDisplayContext}>
      <div ref={contentsRef}>
        {children}
      </div>
    </SideItemsDisplayContext.Provider>
    </SideItemsPlacementContext.Provider>
  );
}

export const SideItemsSidebar = () => {
  const classes = useStyles(styles);
  const placementContext = useContext(SideItemsPlacementContext);
  const displayContext = useContext(SideItemsDisplayContext);
  const sideItemColumnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sideItemColumnRef.current) return;
    if (!displayContext) return;
    
    const sidebarColumnTop = getOffsetChainTop(sideItemColumnRef.current);

    // Place all the side-items in the container, without yet handling their
    // positioning. This makes it possible to measure their heights (which may
    // depend on the width of the column).
    for (const sideItem of displayContext.sideItems) {
      if (sideItem.container.parentNode === sideItemColumnRef.current) {
        continue;
      }
      if (sideItem.container.parentNode !== null) {
        sideItem.container.remove();
      }
      sideItemColumnRef.current.appendChild(sideItem.container);
    }
    
    // Measure side-item anchor positions and element heights
    // (Note that it's important to do the measurement all at once, and not
    // alternate between measuring and editing the DOM, for performance
    // reasons, as each edit invalidates layout and each measurement triggers
    // reflow if layout is invalidated.)
    for (let i=0; i<displayContext.sideItems.length; i++) {
      const sideItem = displayContext.sideItems[i];
      let anchorEl = sideItem.anchorEl;

      // If the anchor is inside hidden content (e.g. a collapsed section with
      // display:none), offsetParent is null and getOffsetChainTop returns 0,
      // which would place the side comment at the top of the page. Walk up to
      // find the nearest visible ancestor so the comment appears next to the
      // collapsed section instead.
      if (anchorEl.offsetParent === null && anchorEl !== document.body && anchorEl.isConnected) {
        let ancestor = anchorEl.parentElement;
        while (ancestor && ancestor.offsetParent === null && ancestor !== document.body) {
          ancestor = ancestor.parentElement;
        }
        if (ancestor) {
          anchorEl = ancestor;
        }
      }

      sideItem.anchorTop = getOffsetChainTop(anchorEl) - sidebarColumnTop + sideItem.options.offsetTop;
      sideItem.anchorLeft = anchorEl.offsetLeft;
      sideItem.sideItemHeight = sideItem.options.measuredElement?.current?.clientHeight ?? sideItem.container.clientHeight;
    }
    
    // Sort side-items by their anchor position
    const sortedSideItems = orderBy(displayContext.sideItems,
      [s => s.anchorTop, s => s.anchorLeft]
    );

    const sidebarColumnHeight = sideItemColumnRef.current.clientHeight;

    // Compute default positions (single downward pass)
    const positions = new Array<number>(sortedSideItems.length);
    {
      let top = 0;
      for (let i = 0; i < sortedSideItems.length; i++) {
        positions[i] = Math.max(top, sortedSideItems[i].anchorTop!);
        top = positions[i] + sortedSideItems[i].sideItemHeight!;
      }
    }

    // If there's a focused item, adjust positions so the focused item sits
    // at its anchor, then cascade any overlaps.
    const focusedIndex = displayContext.focusedAnchor
      ? sortedSideItems.findIndex(s => s.anchorEl === displayContext.focusedAnchor)
      : -1;

    if (focusedIndex >= 0) {
      // Place focused item at its anchor position
      positions[focusedIndex] = sortedSideItems[focusedIndex].anchorTop!;

      // Items below: recalculate downward from the focused item, which may
      // have moved up and freed space for items below to settle closer to
      // their anchors.
      let bottom = positions[focusedIndex] + sortedSideItems[focusedIndex].sideItemHeight!;
      for (let i = focusedIndex + 1; i < sortedSideItems.length; i++) {
        positions[i] = Math.max(bottom, sortedSideItems[i].anchorTop!);
        bottom = positions[i] + sortedSideItems[i].sideItemHeight!;
      }

      // Items above: only push up if they actually overlap with the item
      // below them. Otherwise keep them at their default positions.
      let top = positions[focusedIndex];
      for (let i = focusedIndex - 1; i >= 0; i--) {
        if (positions[i] + sortedSideItems[i].sideItemHeight! > top) {
          positions[i] = top - sortedSideItems[i].sideItemHeight!;
        }
        top = positions[i];
      }
    }

    // Apply positions
    for (let i = 0; i < sortedSideItems.length; i++) {
      const newTop = positions[i];
      const style = `top:${newTop}px; --sidebar-column-remaining-height: ${sidebarColumnHeight - newTop}px`;
      sortedSideItems[i].container.setAttribute("style", style);
    }
    
    // Use a ResizeObserver to watch for size-changes of side-item containers
    const resizeObserver = new ResizeObserver((entries) => {
      if (placementContext) {
        for (let entry of entries) {
          placementContext.resizeItem(entry.target as HTMLElement, entry.contentRect.height);
        }
      }
    });
    for (const sideItem of displayContext.sideItems) {
      resizeObserver.observe(sideItem.container);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, [displayContext, placementContext]);

  return useMemo(() => <div
    className={classes.sidebar}
    ref={sideItemColumnRef}
  />, [classes]);
}

export const SideItem = ({options, children, anchorEl}: {
  options?: Partial<SideItemOptions>,
  children: React.ReactNode,
  anchorEl?: HTMLElement|null,
}) => {
  const placementContext = useContext(SideItemsPlacementContext);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement|null>(null);
  const mergedOptions: SideItemOptions = {...defaultSideItemOptions, ...options};
  
  useEffect(() => {
    const anchor = anchorEl ?? anchorRef.current;
    if (placementContext && anchor) {
      setPortalContainer(placementContext.addSideItem(anchor, mergedOptions));
      
      return () => {
        placementContext.removeSideItem(anchor);
        setPortalContainer(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placementContext, anchorEl, mergedOptions.format, mergedOptions.offsetTop, mergedOptions.measuredElement]);

  if (!placementContext) {
    return null;
  }

  if (anchorEl) {
    return <>{portalContainer && createPortal(children, portalContainer)}</>;
  }

  return <span ref={anchorRef}>
    {portalContainer && createPortal(children, portalContainer)}
  </span>
}

export const useHasSideItemsSidebar = (): boolean => {
  return !!useContext(SideItemsPlacementContext);
}

export const useSideItemsFocus = (): ((anchorEl: HTMLElement | null) => void) | null => {
  const ctx = useContext(SideItemsPlacementContext);
  return ctx?.setFocusedAnchor ?? null;
}

export const NoSideItems = ({children}: {
  children: React.ReactNode
}) => {
  return <SideItemsPlacementContext.Provider value={null}>
    <SideItemsDisplayContext.Provider value={null}>
      {children}
    </SideItemsDisplayContext.Provider>
  </SideItemsPlacementContext.Provider>
}

