import React, { useState } from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import MenuItem from "@material-ui/core/MenuItem";
import Collapse from '@material-ui/core/Collapse';
import ArrowForwardIcon from '@material-ui/icons/ArrowForwardIos';
import { useLocation } from "../../../lib/routeUtil";
import { Link } from "../../../lib/reactRouterWrapper";
import classNames from "classnames";
import { styles as itemStyles } from "./TabNavigationItem";
import type { MenuTab, MenuTabRegular } from "./menuTabs";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: -6,
  },
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  arrow: {
    opacity: 1,
    color: theme.palette.grey[800],
    width: 16,
    margin: "8px 24px 0 18px",
    cursor: "pointer",
    transition: "transform 0.2s ease",
  },
  iconExpanded: {
    transform: "rotate(90deg) translate(-6px, 4px)",
  },
  title: {
    color: theme.palette.grey[800],
    fontSize: "1.2rem",
    paddingLeft: 3,
  },
  mainItem: {
    ...(theme.forumType === "LessWrong"
      ? {
        paddingTop: 7,
        paddingBottom: 8,
        paddingLeft: 16,
        paddingRight: 16,
      } : {
        paddingTop: 12,
        paddingBottom: 12,
        paddingLeft: 3,
      }
    ),
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
  },
  navButton: {
    '&:hover': {
      opacity:.6,
      backgroundColor: 'transparent' // Prevent MUI default behavior of rendering solid background on hover
    },
  }
});

type TabNavigationCollapsibleMenuProps = {
  items: MenuTab[],
  defaultExpanded: boolean,
  tab: MenuTabRegular,
  onMenuItemClick?: (e: React.MouseEvent<HTMLAnchorElement>, tabId: string) => void;
  onClickSection?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  classes: ClassesType,
}

const TabNavigationCollapsibleMenu = ({
  items, defaultExpanded, tab, onMenuItemClick, onClickSection, classes,
}: TabNavigationCollapsibleMenuProps) => {
  const {pathname} = useLocation();
  const {title, link, noLinkInSidebar} = tab;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const {LWTooltip, TabNavigationMenu} = Components;

  // MenuItem takes a component and passes unrecognized props to that component,
  // but its material-ui-provided type signature does not include this feature.
  // Cast to any to work around it, to be able to pass a "to" parameter.
  const MenuItemUntyped = MenuItem as any;

  const handleArrowClick = () => setIsExpanded(!isExpanded);

  const handleTitleClick = (e: React.MouseEvent<HTMLAnchorElement>) =>
    onMenuItemClick?.(e, tab.id);

  return (
    <div className={classes.root}>
      <div className={classes.container}>
        <span
          onClick={handleArrowClick}
          className={classNames(classes.icon, classes.arrow, { [classes.iconExpanded]: isExpanded })}
        >
          <ArrowForwardIcon fontSize="small" />
        </span>
        <LWTooltip placement="right-start" title={tab.tooltip || ""}>
          {link && !noLinkInSidebar ? (
            <MenuItemUntyped
              onClick={handleTitleClick}
              component={Link}
              to={link || ""}
              disableGutters
              classes={{
                root: classNames(classes.title, {
                  [classes.mainItem]: !tab.subItem,
                  [classes.navButton]: !tab.subItem,
                  [classes.selected]: pathname === link,
                }),
              }}
              disableTouchRipple
            >
              <span className={classes.navText}>{title}</span>
            </MenuItemUntyped>
          ) : (
            <div className={classNames(classes.title, { [classes.mainItem]: !tab.subItem })}>
              <span className={classes.navText}>{title}</span>
            </div>
          )}
        </LWTooltip>
      </div>
      <Collapse in={isExpanded}>
        <TabNavigationMenu menuTabs={items} onClickSection={onClickSection} transparentBackground />
      </Collapse>
    </div>
  );
}

const TabNavigationCollapsibleMenuComponent = registerComponent(
  'TabNavigationCollapsibleMenu', TabNavigationCollapsibleMenu, {
    styles: (theme: ThemeType) => ({...itemStyles(theme), ...styles(theme)}),
  }
);

declare global {
  interface ComponentTypes {
    TabNavigationCollapsibleMenu: typeof TabNavigationCollapsibleMenuComponent
  }
}
