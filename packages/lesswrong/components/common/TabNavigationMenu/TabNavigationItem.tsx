import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from '../../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { useLocation } from '../../../lib/routeUtil';
import { MenuTabRegular } from './menuTabs';

export const iconWidth = 30

const styles = (theme: ThemeType): JssStyles => ({
  selected: {
    '& $icon': {
      opacity: 1,
    },
    '& $navText': {
      color: theme.palette.grey[900],
      fontWeight: 600,
    },
  },
  navButton: {
    '&:hover': {
      opacity:.6,
      backgroundColor: 'transparent' // Prevent MUI default behavior of rendering solid background on hover
    },
    paddingTop: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit*2,
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    flexDirection: "row",
  },
  subItemOverride: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    '&:hover': {
      backgroundColor: 'transparent' // Prevent MUI default behavior of rendering solid background on hover
    }
  },
  icon: {
    opacity: .3,
    width: iconWidth,
    height: 28,
    marginRight: theme.spacing.unit*2,
    display: "inline",
  },
  navText: {
    ...theme.typography.body2,
    color: theme.palette.grey[800],
    textTransform: "none !important",
  },
  homeIcon: {
    '& svg': {
      height: 29,
      position: "relative",
      top: -1,
    }
  },
})

type TabNavigationItemProps = {
  tab: MenuTabRegular,
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void,
  classes: ClassesType,
}

const TabNavigationItem = ({tab, onClick, classes}: TabNavigationItemProps) => {
  const { TabNavigationSubItem, LWTooltip } = Components
  const { pathname } = useLocation()
  
  // MenuItem takes a component and passes unrecognized props to that component,
  // but its material-ui-provided type signature does not include this feature.
  // Cast to any to work around it, to be able to pass a "to" parameter.
  const MenuItemUntyped = MenuItem as any;
  
  // React router links don't handle external URLs, so use a
  // normal HTML a tag if the URL is external
  const externalLink = /https?:\/\//.test(tab.link);
  const Element = externalLink ?
    ({to, ...rest}) => <a href={to} target="_blank" rel="noopener noreferrer" {...rest} />
    : Link;

  return <LWTooltip placement='right-start' title={tab.tooltip || ''}>
    <MenuItemUntyped
      onClick={onClick}
      component={Element} to={tab.link}
      disableGutters
      classes={{root: classNames({
        [classes.navButton]: !tab.subItem,
        [classes.subItemOverride]: tab.subItem,
        [classes.selected]: pathname === tab.link,
      })}}
      disableTouchRipple
    >
      {(tab.icon || tab.iconComponent) && <span
        className={classNames(classes.icon, {[classes.homeIcon]: tab.id === 'home'})}
      >
        {tab.iconComponent && <tab.iconComponent />}
        {tab.icon && tab.icon}
      </span>}
      {tab.subItem ?
        <TabNavigationSubItem>
          {tab.title}
        </TabNavigationSubItem> :
        <span className={classes.navText}>
          {tab.title}
        </span>
      }
    </MenuItemUntyped>
  </LWTooltip>
}

const TabNavigationItemComponent = registerComponent(
  'TabNavigationItem', TabNavigationItem, {styles}
);

declare global {
  interface ComponentTypes {
    TabNavigationItem: typeof TabNavigationItemComponent
  }
}
