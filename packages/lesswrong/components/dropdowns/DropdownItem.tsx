import React, { FC, ReactElement, MouseEvent, PropsWithChildren, ReactNode } from "react";
import ForumIcon, { ForumIconName } from "../common/ForumIcon";
import ListItemIcon from "@/lib/vendor/@material-ui/core/src/ListItemIcon";
import { Link } from "../../lib/reactRouterWrapper";
import type { HashLinkProps } from "../common/HashLink";
import classNames from "classnames";
import { isFriendlyUI } from "../../themes/forumTheme";
import { MenuItem } from "../common/Menus";
import Loading from "../vulcan-core/Loading";
import LWTooltip from "../common/LWTooltip";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles("DropdownItem", (theme: ThemeType) => ({
  root: {
    ...(isFriendlyUI && {
      "&:hover": {
        opacity: 1,
      },
    }),
  },
  main: {
    ...(isFriendlyUI && {
      borderRadius: theme.borderRadius.default,
      padding: 8,
      "&:hover": {
        background: theme.palette.dropdown.hoverBackground,
        "& svg": {
          color: theme.palette.grey[1000],
        },
      },
      "& .ForumIcon-root": {
        fontSize: isFriendlyUI ? 20 : undefined,
      },
    }),
  },
  noIcon: {
    paddingLeft: isFriendlyUI ? 12 : undefined,
  },
  title: {
    flexGrow: 1,
    overflowX: "clip",
    textOverflow: "ellipsis",
  },
  afterIcon: {
    fontSize: '16px !important',
    marginLeft: 8,
    color: theme.palette.grey[600],
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
  tooltip: {
    display: "block",
  },
}));

const DummyWrapper: FC<PropsWithChildren<{className?: string}>> = ({className, children}) =>
  <div className={className}>{children}</div>;

const RawLink: FC<PropsWithChildren<{
  to: string,
  className?: string,
}>> = ({to, className, children}) => (
  <a href={to} className={className}>
    {children}
  </a>
);

/**
 * Dropdown item, for use in menus such as the triple-dot menus on posts
 * and comments. Note that menus are positioned based on size immediately
 * after opening, so you should avoid loading states that make menu items
 * significantly narrower than they will be when loaded.
 */
export const DropdownItem = ({
  title,
  sideMessage,
  onClick,
  to,
  icon,
  iconClassName,
  menuItemClassName,
  afterIcon,
  tooltip,
  disabled,
  loading,
  rawLink,
}: {
  title: ReactNode,
  sideMessage?: string,
  icon?: ForumIconName | (() => ReactElement),
  iconClassName?: string,
  menuItemClassName?: string,
  afterIcon?: ForumIconName | (() => ReactElement),
  tooltip?: string,
  disabled?: boolean,
  /**
   * Replaces the menu item with a loading indicator. This should ONLY be used
   * to indicate an action is in progress, that started after the menu has
   * already opened; if the contents of a menu start out in a loading state,
   * then its width will change and this may lead to it being awkwardly partly
   * off-screen. */
  loading?: boolean,
  rawLink?: boolean,
  onClick?: (event: MouseEvent) => void | Promise<void>,
  to?: HashLinkProps["to"],
}) => {
  const LinkWrapper = to ? rawLink ? RawLink : Link : DummyWrapper;
  const TooltipWrapper = tooltip ? LWTooltip : DummyWrapper;
  const classes = useStyles(styles);
  return (
    <LinkWrapper to={to!} className={classes.root}>
      <TooltipWrapper title={tooltip!} className={classes.tooltip}>
        <MenuItem
          onClick={onClick}
          disabled={disabled}
          className={classNames(classes.main, menuItemClassName, {[classes.noIcon]: !icon})}
        >
          {loading &&
            <ListItemIcon>
              <Loading />
            </ListItemIcon>
          }
          {!loading && <>
            {icon && <ListItemIcon>
              {typeof icon === "string"
                ? <ForumIcon icon={icon} className={iconClassName} />
                : icon()
              }
            </ListItemIcon>}
            <span className={classes.title}>{title}</span>
            {typeof afterIcon === "string"
              ? <ForumIcon icon={afterIcon} className={classes.afterIcon} />
              : afterIcon?.()
            }
            {sideMessage &&
              <div className={classes.sideMessage}>
                {sideMessage}
              </div>
            }
          </>}
        </MenuItem>
      </TooltipWrapper>
    </LinkWrapper>
  );
}

export default DropdownItem;
