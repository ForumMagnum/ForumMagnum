// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import clsx from "clsx";

import { IconButton } from "./IconButton";
import { PenModeIcon } from "./icons";

type PenModeButtonProps = {
  title?: string;
  checked: boolean;
  onChange?(): void;
  isMobile?: boolean;
  penDetected: boolean;
};

export const PenModeButton = (props: PenModeButtonProps) => {
  if (!props.penDetected) {
    return null;
  }

  return (
    <IconButton
      className={clsx("ToolIcon__penMode", { "is-mobile": props.isMobile })}
      type="toggle"
      icon={PenModeIcon}
      checked={props.checked}
      title={`${props.title}`}
      aria-label={`${props.title}`}
      onSelect={() => props.onChange?.()}
    />
  );
};
