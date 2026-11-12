// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import React, { useContext } from "react";

import { composeEventHandlers } from "@excalidraw/common";

export const DropdownMenuContentPropsContext = React.createContext<{
  onSelect?: (event: Event) => void;
}>({});

export const getDropdownMenuItemClassName = (
  className = "",
  selected = false,
  hovered = false,
) => {
  return `dropdown-menu-item dropdown-menu-item-base ${className} ${
    selected ? "dropdown-menu-item--selected" : ""
  } ${hovered ? "dropdown-menu-item--hovered" : ""}`.trim();
};

export const useHandleDropdownMenuItemSelect = (
  onSelect: ((event: Event) => void) | undefined,
) => {
  const DropdownMenuContentProps = useContext(DropdownMenuContentPropsContext);

  return composeEventHandlers(onSelect, (event) => {
    DropdownMenuContentProps.onSelect?.(event);
  });
};
