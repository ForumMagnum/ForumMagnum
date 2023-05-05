import React, { FC, MouseEvent } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { ForumIconName } from "../common/ForumIcon";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import { Link } from "../../lib/reactRouterWrapper";
import type { HashLinkProps } from "../common/HashLink";

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

export type DropdownItemAction = {
  onClick: (event: MouseEvent) => void | Promise<void>,
  to?: never,
} | {
  onClick?: never,
  to: HashLinkProps["to"],
}

export type DropdownItemProps = DropdownItemAction & {
  title: string,
  sideMessage?: string,
  icon?: ForumIconName,
  afterIcon?: ForumIconName,
  disabled?: boolean,
}

const DummyLink: FC<{to: HashLinkProps["to"]}> = ({children}) => <>{children}</>;

const DropdownItem = ({
  title,
  sideMessage,
  onClick,
  to,
  icon,
  afterIcon,
  disabled,
  classes,
}: DropdownItemProps & {classes: ClassesType}) => {
  const Wrapper = to ? Link : DummyLink;
  const {MenuItem, ForumIcon} = Components;
  return (
    <Wrapper to={to!}>
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
    </Wrapper>
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
