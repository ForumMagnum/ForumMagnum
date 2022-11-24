import React, { useState } from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";
import type { MenuTabRegular } from "./menuTabs";
import MenuItem from "@material-ui/core/MenuItem";
import { useLocation } from "../../../lib/routeUtil";
import { Link } from "../../../lib/reactRouterWrapper";
import classNames from "classnames";
import { styles as itemStyles } from "./TabNavigationItem";
import ArrowForwardIcon from '@material-ui/icons/ArrowForwardIos';

const styles = (theme: ThemeType): JssStyles => ({
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  arrow: {
    opacity: 1,
    color: theme.palette.grey[800],
    width: 16,
    margin: "8px 10px 0 32px",
    cursor: "pointer",
    transition: "all ease 0.2s",
  },
  iconExpanded: {
    transform: "rotate(90deg) translate(-6px, 4px)",
  },
  title: {
    color: theme.palette.grey[800],
    fontSize: "1.2rem",
    paddingLeft: 2,
  },
});

type TabNavigationCollapsibleMenuProps = {
  tab: MenuTabRegular,
  defaultExpanded: boolean,
  classes: ClassesType,
}

const TabNavigationCollapsibleMenu = ({
  tab, defaultExpanded, classes,
}: TabNavigationCollapsibleMenuProps) => {
  const {pathname} = useLocation();
  const {title, link} = tab;
  const {LWTooltip} = Components;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // MenuItem takes a component and passes unrecognized props to that component,
  // but its material-ui-provided type signature does not include this feature.
  // Cast to any to work around it, to be able to pass a "to" parameter.
  const MenuItemUntyped = MenuItem as any;

  const handleArrowClick = () => setIsExpanded(!isExpanded);

  const handleTitleClick = () => {}

  return (
    <LWTooltip placement='right-start' title={tab.tooltip || ''}>
      <div className={classes.container}>
        <span onClick={handleArrowClick} className={classNames(
          classes.icon,
          classes.arrow,
          {[classes.iconExpanded]: isExpanded}
        )}>
          <ArrowForwardIcon fontSize="small" />
        </span>
        <MenuItemUntyped
          onClick={handleTitleClick}
          component={Link}
          to={link}
          disableGutters
          classes={{root: classNames(classes.title, {
            [classes.navButton]: !tab.subItem,
            [classes.selected]: pathname === link,
          })}}
          disableTouchRipple
        >
          <span className={classes.navText}>
            {title}
          </span>
        </MenuItemUntyped>
      </div>
    </LWTooltip>
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
