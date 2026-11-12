// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import React from "react";

const DropdownMenuItemCustom = ({
  children,
  className = "",
  selected,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      {...rest}
      className={`dropdown-menu-item-base dropdown-menu-item-custom ${className} ${
        selected ? `dropdown-menu-item--selected` : ``
      }`.trim()}
    >
      {children}
    </div>
  );
};

export default DropdownMenuItemCustom;
