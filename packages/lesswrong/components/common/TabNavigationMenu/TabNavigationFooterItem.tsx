import { registerComponent } from '../../../lib/vulcan-lib/components';
import React, { Ref } from 'react';
import { Link } from '../../../lib/reactRouterWrapper';
import { useLocation } from '../../../lib/routeUtil';
import classNames from 'classnames';
import { MenuTabRegular } from './menuTabs';
import { TooltipRef } from '../FMTooltip';
import TabNavigationSubItem from "./TabNavigationSubItem";

const smallIconSize = 23

const styles = (theme: ThemeType) => ({
  selected: {
    '& $icon': {
      opacity: 1,
      color: theme.isFriendlyUI ? theme.palette.text.alwaysWhite : undefined,
    },
    '& $navText': {
      color: theme.isFriendlyUI ? theme.palette.text.alwaysWhite : theme.palette.grey[900],
      fontWeight: 600,
    },
    backgroundColor: theme.palette.grey[400],
    
    ...(theme.isFriendlyUI && {
      backgroundColor: theme.palette.secondary.main
    }),
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
    ...(theme.isFriendlyUI
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
    opacity: theme.isFriendlyUI ? 1 : 0.45,
    width: smallIconSize,
    height: smallIconSize,
    '& svg': {
      width: smallIconSize,
      height: smallIconSize,
      fill: theme.isFriendlyUI ? undefined : "currentColor",
      color: theme.isFriendlyUI ? "inherit" : undefined,
    }
  },
  navText: {
    ...theme.typography.body2,
    color: theme.isFriendlyUI ? "inherit" : theme.palette.grey[700],
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
  const { pathname } = useLocation()
  // React router links don't handle external URLs, so use a
  // normal HTML a tag if the URL is external
  const externalLink = /https?:\/\//.test(tab.link);
  const Element = externalLink ?
    ({to, anchorRef, ...rest}: { to: string, anchorRef: Ref<HTMLAnchorElement>, className: string }) =>
      <a href={to} target="_blank" rel="noopener noreferrer" ref={anchorRef} {...rest} />
    : Link;

  const isSelected = pathname === tab.link;
  const hasIcon = tab.icon || tab.iconComponent || tab.selectedIconComponent;
  const IconComponent = isSelected
    ? tab.selectedIconComponent ?? tab.iconComponent
    : tab.iconComponent;

  return <TooltipRef placement='top' title={tab.tooltip || ''} distance={16}>
    {(ref: Ref<HTMLAnchorElement>) => <Element
      to={tab.link}
      anchorRef={ref}
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
    </Element>}
  </TooltipRef>
}

export default registerComponent(
  'TabNavigationFooterItem', TabNavigationFooterItem, {styles}
);


