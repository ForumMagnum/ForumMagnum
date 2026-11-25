import React, { createContext, ReactNode, RefObject, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Placement as PopperPlacementType } from "popper.js"
import classNames from 'classnames';
import omit from 'lodash/omit';
import LWPopper, { styles as popperStyles } from './LWPopper';
import type { HoverAnchor } from './withHover';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

interface GroupRelativePlacement {
  relativeTo: "group",
  placement: PopperPlacementType,
}

interface TraySlotPlacement {
  slot: string,
}

/**
 * Where a tooltip goes. One of:
 *  - A popper placement, relative to the element that is hovered to open the
 *    tooltip.
 *  - A popper placement relative to the anchor of the enclosing TooltipGroup.
 *  - A named slot in the enclosing TooltipGroup's tray. The tray's layout
 *    positions it together with the other tooltips that are open in the tray.
 *    Tooltips in a tray can't be interacted with, and are never flipped to
 *    another side to stay on screen.
 */
export type TooltipPlacement = PopperPlacementType | GroupRelativePlacement | TraySlotPlacement;

export const isTraySlotPlacement = (placement: TooltipPlacement): placement is TraySlotPlacement =>
  typeof placement === "object" && "slot" in placement;

interface TooltipGroupContextType {
  anchorRef: RefObject<HTMLElement|null>,
  slotElements: Record<string, HTMLElement>,
  setSlotElement: (name: string, element: HTMLElement|null) => void,
  addOpenSlotTooltip: () => () => void,
}

export const TooltipGroupContext = createContext<TooltipGroupContextType|null>(null);

const missingGroupMessage = "A tooltip is placed relative to a TooltipGroup, but is not inside one";

export const getPopperTarget = (
  placement: PopperPlacementType|GroupRelativePlacement,
  hoverAnchorEl: HoverAnchor|null,
  group: TooltipGroupContextType|null,
): { placement: PopperPlacementType, anchorEl: HoverAnchor|null } => {
  if (typeof placement === "string") {
    return { placement, anchorEl: hoverAnchorEl };
  }
  if (!group) {
    throw new Error(missingGroupMessage);
  }
  return { placement: placement.placement, anchorEl: group.anchorRef.current };
};

const styles = defineStyles("TooltipGroup", (_theme: ThemeType) => ({
  tray: {
    containerType: "inline-size",
  },
}));

/**
 * Lets the tooltips of several hover targets be positioned relative to one
 * shared anchor element (the one `anchorRef` is attached to), rather than each
 * relative to its own hover target.
 *
 * `tray` is rendered directly below the anchor, exactly as wide as it, while
 * any tooltip with a slot placement is open. It should contain a <TooltipSlot>
 * for each slot name used by tooltips inside the group, and is responsible for
 * laying those slots out. It is a size container, so its layout can use
 * container queries against the anchor's width.
 */
export const TooltipGroup = ({anchorRef, tray, children}: {
  anchorRef: RefObject<HTMLElement|null>,
  tray: ReactNode,
  children: ReactNode,
}) => {
  const classes = useStyles(styles);
  const [slotElements, setSlotElements] = useState<Record<string, HTMLElement>>({});
  const [openSlotTooltipCount, setOpenSlotTooltipCount] = useState(0);

  const setSlotElement = useCallback((name: string, element: HTMLElement|null) => {
    setSlotElements((previous) => element
      ? {...previous, [name]: element}
      : omit(previous, name)
    );
  }, []);

  const addOpenSlotTooltip = useCallback(() => {
    setOpenSlotTooltipCount((count) => count + 1);
    return () => setOpenSlotTooltipCount((count) => count - 1);
  }, []);

  const group = useMemo(
    () => ({ anchorRef, slotElements, setSlotElement, addOpenSlotTooltip }),
    [anchorRef, slotElements, setSlotElement, addOpenSlotTooltip],
  );

  return <TooltipGroupContext.Provider value={group}>
    {children}
    <LWPopper
      open={openSlotTooltipCount > 0}
      anchorEl={anchorRef.current}
      placement="bottom-start"
      allowOverflow
      matchAnchorWidth
      clickable={false}
    >
      <div className={classes.tray}>{tray}</div>
    </LWPopper>
  </TooltipGroupContext.Provider>;
};

export const TooltipSlot = ({name, className}: {
  name: string,
  className?: string,
}) => {
  const group = useContext(TooltipGroupContext);
  if (!group) {
    throw new Error("TooltipSlot must be inside the tray of a TooltipGroup");
  }
  const { setSlotElement } = group;
  const ref = useCallback((element: HTMLDivElement|null) => setSlotElement(name, element), [name, setSlotElement]);

  return <div ref={ref} className={className} />;
};

export const TooltipSlotContent = ({slot, open, tooltip, hideOnTouchScreens, className, children}: {
  slot: string,
  open: boolean,
  tooltip: boolean,
  hideOnTouchScreens: boolean,
  className?: string,
  children: ReactNode,
}) => {
  const popperClasses = useStyles(popperStyles);
  const group = useContext(TooltipGroupContext);
  if (!group) {
    throw new Error(missingGroupMessage);
  }
  const { slotElements, addOpenSlotTooltip } = group;

  useLayoutEffect(() => {
    if (!open) return;
    return addOpenSlotTooltip();
  }, [open, addOpenSlotTooltip]);

  if (!open) {
    return null;
  }
  const slotElement = slotElements[slot];
  if (!slotElement) {
    const trayIsMounted = Object.keys(slotElements).length > 0;
    if (trayIsMounted) {
      throw new Error(`The enclosing TooltipGroup's tray has no slot named "${slot}"`);
    }
    return null;
  }

  return createPortal(
    <div className={classNames(
      tooltip ? popperClasses.tooltip : popperClasses.default,
      hideOnTouchScreens && popperClasses.hideOnTouchScreens,
      className,
    )}>
      {children}
    </div>,
    slotElement,
  );
};
