import React, { MouseEvent } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { ForumIconName } from "../common/ForumIcon";
import ListItemIcon from "@material-ui/core/ListItemIcon";

const styles = (theme: ThemeType): JssStyles => ({
  afterIcon: {
    fontSize: 20,
    marginLeft: 4,
  },
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
  onClick?: (event: MouseEvent) => void | Promise<void>,
  icon?: ForumIconName,
  afterIcon?: ForumIconName,
  classes: ClassesType,
}

const DropdownItem = ({
  title,
  sideMessage,
  onClick,
  icon,
  afterIcon,
  disabled,
  classes,
}: DropdownItemProps) => {
  const {MenuItem, ForumIcon} = Components;
  return (
    <div>
      <MenuItem
        onClick={onClick}
        disabled={disabled}
      >
        {icon &&
          <ListItemIcon>
            <ForumIcon icon={icon} />
          </ListItemIcon>
        }
        {title}
        {afterIcon && <ForumIcon icon={afterIcon} className={classes.afterIcon} />}
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
