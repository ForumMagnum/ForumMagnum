import { createContext, useContext } from "react";

/**
 * Provided by buttons that host a post menu (the triple-dot menu and the
 * share menu), so that the "Cite" menu item can open a citation popover
 * anchored to the button after the menu itself has closed.
 */
export const OpenCitePopoverContext = createContext<(() => void) | null>(null);

export const useOpenCitePopover = () => useContext(OpenCitePopoverContext);
