// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import clsx from "clsx";

import { IconButton } from "./IconButton";

import type { JSX } from "react";

export const ElementCanvasButton = (props: {
  title?: string;
  icon: JSX.Element;
  checked: boolean;
  onChange?(): void;
  isMobile?: boolean;
}) => {
  return (
    <IconButton
      className={clsx("ToolIcon__MagicButton", {
        "is-mobile": props.isMobile,
      })}
      type="toggle"
      size="small"
      icon={props.icon}
      checked={props.checked}
      title={`${props.title}`}
      aria-label={`${props.title}`}
      onSelect={() => props.onChange?.()}
    />
  );
};
