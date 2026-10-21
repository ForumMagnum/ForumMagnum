// Vendored from: https://github.com/excalidraw/excalidraw/commit/a52cd200927a975322934b42b966133232724bad
import { checkIcon, emptyIcon } from "../icons";

import DropdownMenuItem from "./DropdownMenuItem";

import type { DropdownMenuItemProps } from "./DropdownMenuItem";

const DropdownMenuItemCheckbox = (
  props: Omit<DropdownMenuItemProps, "icon"> & { checked: boolean },
) => {
  return (
    <DropdownMenuItem {...props} icon={props.checked ? checkIcon : emptyIcon} />
  );
};

export default DropdownMenuItemCheckbox;
