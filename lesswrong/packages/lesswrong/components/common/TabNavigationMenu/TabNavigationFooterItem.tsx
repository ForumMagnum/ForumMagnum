import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../../lib/reactRouterWrapper';
import { useLocation } from '../../../lib/routeUtil';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';
import { MenuTabRegular } from './menuTabs';
import { isFriendlyUI } from '../../../themes/forumTheme';

const smallIconSize = 23

const styles = (theme: ThemeType) => ({
  selected: {
    '& $icon': {
      opacity: 1,
      color: isFriendlyUI ? theme.palette.text.alwaysWhite : undefined,
    },
    '& $navText': {
      color: isFriendlyUI ? theme.palette.text.alwaysWhite : theme.palette.grey[900],
      fontWeight: 600,
    },
    backgroundColor: theme.palette.grey[400]
  },
  navButton: {
    paddingTop: theme.spacing.unit,
    paddingBottom: 2,
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "column",
    ...(isFriendlyUI
      ? {
        color: theme.palette.grey[600],
        "&:hover": {
          opacity: 1,
          color: theme.palette.grey[800],
        },
      }
      : {}),
  },
  icon: {
    display: "block",
    opacity: isFriendlyUI ? 1 : 0.45,
    width: smallIconSize,
    height: smallIconSize,
    '& svg': {
      width: smallIconSize,
      height: smallIconSize,
      fill: isFriendlyUI ? undefined : "currentColor",
      color: isFriendlyUI ? "inherit" : undefined,
    }
  },
  navText: {
    ...theme.typography.body2,
    color: isFriendlyUI ? "inherit" : theme.palette.grey[700],
    fontSize: '.8rem',
  },
  homeIcon: {
    '& svg': {
      position: "relative",
      top: -1,
    }
  },
})

type TabNavigationFooterItemProps = {
  tab: MenuTabRegular,
  classes: ClassesType<typeof styles>,
}

const TabNavigationFooterItem = ({tab, classes}: TabNavigationFooterItemProps) => {
  const { TabNavigationSubItem } = Components
  const { pathname } = useLocation()
  // React router links don't handle external URLs, so use a
  // normal HTML a tag if the URL is external
  const externalLink = /https?:\/\//.test(tab.link);
  const Element = externalLink ?
    ({to, ...rest}: { to: string, className: string }) => <a href={to} target="_blank" rel="noopener noreferrer" {...rest} />
    : Link;

  const isSelected = pathname === tab.link;
  const hasIcon = tab.icon || tab.iconComponent || tab.selectedIconComponent;
  const IconComponent = isSelected
    ? tab.selectedIconComponent ?? tab.iconComponent
    : tab.iconComponent;

  return <Tooltip placement='top' title={tab.tooltip || ''}>
    <Element
      to={tab.link}
      className={classNames(classes.navButton, {
        [classes.selected]: isSelected,
      })}
    >
      {hasIcon && <span
        className={classNames(classes.icon, {[classes.homeIcon]: tab.id === 'home'})}
      >
        {IconComponent && <IconComponent />}
        {tab.icon && tab.icon}
      </span>}
      {tab.subItem ?
        <TabNavigationSubItem>
          { tab.mobileTitle || tab.title }
        </TabNavigationSubItem> :
        <span className={classes.navText}>
          { tab.mobileTitle || tab.title }
        </span>
      }
    </Element>
  </Tooltip>
}

const TabNavigationFooterItemComponent = registerComponent(
  'TabNavigationFooterItem', TabNavigationFooterItem, {styles}
);

declare global {
  interface ComponentTypes {
    TabNavigationFooterItem: typeof TabNavigationFooterItemComponent
  }
}
