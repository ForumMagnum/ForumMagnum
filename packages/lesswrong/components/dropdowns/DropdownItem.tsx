import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType): JssStyles => ({
  sideMessage: {
    position: "absolute",
    right: 12,
    top: 12,
    color: theme.palette.text.dim40,
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
});

export type DropdownItemConfig = {
  disabled?: boolean,
}

export type DropdownItemProps = DropdownItemConfig & {
  title: string,
  sideMessage?: string,
  onClick?: () => void | Promise<void>,
  classes: ClassesType,
}

const DropdownItem = ({
  title,
  sideMessage,
  onClick,
  disabled,
  classes,
}: DropdownItemProps) => {
  const {MenuItem} = Components;

  return (
    <div>
      <MenuItem
        onClick={onClick}
        disabled={disabled}
      >
        {title}
        {sideMessage &&
          <div className={classes.sideMessage}>
            {sideMessage}
          </div>
        }
      </MenuItem>
    </div>
  );
}

const DropdownItemComponent = registerComponent(
  "DropdownItem",
  DropdownItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    DropdownItem: typeof DropdownItemComponent
  }
}
